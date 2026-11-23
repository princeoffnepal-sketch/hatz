import "server-only";
import { cookies } from "next/headers";
import { allowRequest } from "@/lib/abuse.server";
import { digest,randomToken } from "@/lib/admin/crypto";
import { CART_ID_COOKIE,CHECKOUT_COOKIE } from "@/lib/cart/server";
import { getCommerceConfig } from "@/config/commerce.server";
import { delivery } from "@/config/delivery";
import { cartHasBlockingLines } from "@/lib/cart/core";
import type { Cart } from "@/lib/types";
import { getGate } from "./gate.server";
import { createCheckoutSession,getStripe } from "./stripe.server";

/**
 * Commerce checkout boundary. The storefront only talks to `beginCheckout`;
 * swapping payment providers means adding another adapter here.
 *
 *  - demo:   never collects payment. Returns the exact reasons checkout is off.
 *  - stripe: Stripe-hosted Checkout (stripe-test and live store modes).
 */
export type BeginCheckoutResult =
  | { kind: "redirect"; url: string }
  | { kind: "preview"; reasons: string[] }
  | { kind: "error"; message: string };

export async function beginCheckout(cart: Cart): Promise<BeginCheckoutResult> {
  if (!cart.lines.length) return { kind: "error", message: "Your bag is empty." };
  if (cartHasBlockingLines(cart)) {
    return { kind: "error", message: "Remove unavailable items from your bag before checking out." };
  }

  const gate = getGate();
  if (!gate.checkoutEnabled) {
    // In demo mode list every unmet launch check, so the preview explains
    // everything that must be connected before real purchases can happen.
    const failing = gate.checks.filter((c) => !c.ok && (gate.mode === "demo" || c.required));
    return { kind: "preview", reasons: failing.map((c) => `${c.label}: ${c.details[0]}${c.details.length > 1 ? ` (+${c.details.length - 1} more)` : ""}`) };
  }

  try {
    if (!await allowRequest('checkout',12,600)) return {kind:'error',message:'Too many checkout attempts. Please wait a few minutes and try again.'};
    const jar=await cookies(), options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:86400};
    const config=getCommerceConfig();
    const fingerprint=await digest(JSON.stringify({checkoutVersion:2,mode:config.mode,tax:config.stripe.automaticTax,delivery:delivery.version,lines:cart.lines.map(l=>[l.variantId,l.quantity,l.unitPrice.amount]).sort()}));
    let cartId=jar.get(CART_ID_COOKIE)?.value;
    if(!cartId || !/^[a-f0-9]{64}$/.test(cartId)){cartId=randomToken();jar.set(CART_ID_COOKIE,cartId,options);}
    let cached: {fingerprint?:string;id?:string}={};
    try{cached=JSON.parse(jar.get(CHECKOUT_COOKIE)?.value??'{}')??{};}catch{}
    if(cached.fingerprint===fingerprint && typeof cached.id==='string' && /^cs_(live|test)_[A-Za-z0-9]{16,240}$/.test(cached.id)){
      const prior=await getStripe().checkout.sessions.retrieve(cached.id);
      if(prior.metadata?.store==='exclusive-hatz' && prior.status==='open' && prior.url) return {kind:'redirect',url:prior.url};
      // A paid/expired checkout must never be reused for another purchase.
      cartId=randomToken();jar.set(CART_ID_COOKIE,cartId,options);
    }
    const session=await createCheckoutSession(cart,new Date(),`hatz:${cartId}:${fingerprint}`);
    jar.set(CHECKOUT_COOKIE,JSON.stringify({fingerprint,id:session.id}),options);
    return {kind:'redirect',url:session.url!};
  } catch (error) {
    console.error("[checkout] Stripe session creation failed", error instanceof Error ? error.name : "UnknownError");
    return { kind: "error", message: "Checkout couldn't start. Please try again in a moment." };
  }
}
