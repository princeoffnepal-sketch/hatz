import { SESSION_ID } from "@/lib/security";
import { allowRequest } from "@/lib/abuse.server";
import { NextResponse, type NextRequest } from "next/server";
import { getCommerceConfig } from "@/config/commerce.server";
import { CART_COOKIE,CART_ID_COOKIE,CHECKOUT_COOKIE } from "@/lib/cart/server";
import { getStripe } from "@/lib/checkout/stripe.server";
import { isPaidStoreSession } from "@/lib/checkout/session";
import { handlePaidCheckout } from "@/lib/fulfillment/orders.server";

/**
 * Stripe redirects here after payment. We verify the session server-side
 * before clearing the bag and showing a confirmation; a URL alone never
 * produces a success page.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const { mode } = getCommerceConfig();
  const cartUrl = new URL("/cart?checkout=incomplete", request.url);
  if (mode === "demo" || !sessionId || !SESSION_ID.test(sessionId)) {
    return NextResponse.redirect(cartUrl);
  }
  try {
    if (!await allowRequest("order-lookup",60,600,request.headers)) return new Response("Please wait before trying again.",{status:429,headers:{"Retry-After":"600"}});
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (!isPaidStoreSession(session, mode)) {
      return NextResponse.redirect(cartUrl);
    }
    // Idempotent backup if the payment webhook has not arrived yet.
    await handlePaidCheckout(session);
  } catch {
    return NextResponse.redirect(cartUrl);
  }
  const response = NextResponse.redirect(new URL(`/order/confirmed?session_id=${sessionId}`, request.url));
  // A saved confirmation link must not clear an unrelated shopping bag.
  let ownCheckout=false;
  try{ownCheckout=JSON.parse(request.cookies.get(CHECKOUT_COOKIE)?.value??'{}')?.id===sessionId;}catch{}
  if(ownCheckout){
    response.cookies.delete(CART_COOKIE);
    response.cookies.delete(CART_ID_COOKIE);
    response.cookies.delete(CHECKOUT_COOKIE);
  }
  return response;
}
