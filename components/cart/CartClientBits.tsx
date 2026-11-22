"use client";

import Link from "next/link";
import { useEffect, type ComponentProps } from "react";
import { track } from "@/lib/analytics";
import type { Cart } from "@/lib/types";
import { useCartUi } from "./CartProvider";

/** Link that also closes the cart drawer (needed when the target is the current page). */
export function DrawerLink(props: ComponentProps<typeof Link>) {
  const { closeDrawer } = useCartUi();
  return (
    <Link
      {...props}
      onClick={(event) => {
        closeDrawer();
        props.onClick?.(event);
      }}
    />
  );
}

/** Fires view_cart on the cart page, or when the drawer opens. */
export function CartViewTracker({ cart, drawer = false }: { cart: Cart; drawer?: boolean }) {
  const { drawerOpen } = useCartUi();
  const key = cart.lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  const active = !drawer || drawerOpen;
  useEffect(() => {
    if (!active) return;
    track("view_cart", {
      currency: cart.subtotal.currency,
      value: cart.subtotal.amount / 100,
      items: cart.lines.map((l) => ({ item_id: l.productId, item_name: l.name, item_variant: l.variantId, quantity: l.quantity })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);
  return null;
}
