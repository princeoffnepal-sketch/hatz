import "server-only";
import { cartHasBlockingLines } from "@/lib/cart/core";
import type { Cart } from "@/lib/types";
import { getGate } from "./gate.server";
import { createCheckoutSession } from "./stripe.server";

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
    return { kind: "redirect", url: await createCheckoutSession(cart) };
  } catch (error) {
    console.error("[checkout] Stripe session creation failed", error instanceof Error ? error.name : "UnknownError");
    return { kind: "error", message: "Checkout couldn't start. Please try again in a moment." };
  }
}
