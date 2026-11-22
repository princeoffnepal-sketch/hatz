"use client";

import { useActionState, useEffect, useRef } from "react";
import { checkoutAction, type CheckoutState } from "@/lib/cart/actions";
import { track } from "@/lib/analytics";
import type { CheckoutAvailability } from "@/lib/checkout/gate.server";
import type { Cart } from "@/lib/types";
import { useCartUi } from "./CartProvider";

const initial: CheckoutState = { kind: "idle" };

/**
 * Starts checkout through the server adapter. In demo mode the server returns
 * a preview explaining exactly what must be connected; no payment form, card
 * field or fake confirmation is ever shown.
 */
export function CheckoutButton({ cart, availability }: { cart: Cart; availability: CheckoutAvailability }) {
  const [state, action, pending] = useActionState(checkoutAction, initial);
  const { announce } = useCartUi();
  const panelRef = useRef<HTMLDivElement>(null);
  const handled = useRef<number | null>(null);
  const blocked = cart.lines.some((l) => !l.available);

  useEffect(() => {
    if (state.kind === "idle" || handled.current === state.at) return;
    handled.current = state.at;
    if (state.kind === "preview") {
      announce("Checkout preview. Orders are not open yet.");
      panelRef.current?.focus();
    } else {
      announce(state.message);
    }
  }, [state, announce]);

  return (
    <div>
      <form
        action={action}
        onSubmit={() => {
          // Only record begin_checkout when real checkout can actually start.
          if (availability.enabled && !blocked) {
            track("begin_checkout", {
              currency: cart.subtotal.currency,
              value: cart.subtotal.amount / 100,
              items: cart.lines.map((l) => ({ item_id: l.productId, item_name: l.name, item_variant: l.variantId, quantity: l.quantity, price: l.unitPrice.amount / 100 })),
            });
          }
        }}
      >
        <button type="submit" className="btn btn-dark w-full text-base" disabled={pending || blocked} aria-busy={pending}>
          {pending ? "Starting checkout…" : availability.enabled ? "Checkout" : "Checkout (preview)"}
        </button>
      </form>

      {blocked && (
        <p className="mt-2 text-sm text-alert" role="alert">
          Remove unavailable items to continue.
        </p>
      )}

      {state.kind === "error" && (
        <p className="mt-2 text-sm font-medium text-alert" role="alert">
          {state.message}
        </p>
      )}

      {state.kind === "preview" && (
        <div ref={panelRef} tabIndex={-1} className="notice mt-4 outline-none" role="region" aria-label="Checkout preview">
          <p className="font-semibold text-ink">Orders are not open yet.</p>
          <p className="mt-1 text-ink-soft">
            Your bag is saved, but no order has been placed and nothing has been charged.
            We are finishing payment and fulfillment setup.
          </p>
          <p className="mt-3"><a href="mailto:exclusivehatzz@gmail.com" className="link">Contact Exclusive Hatz</a></p>
        </div>
      )}
    </div>
  );
}
