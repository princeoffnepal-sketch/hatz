"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { addToCartAction, type AddToCartState } from "@/lib/cart/actions";
import { track } from "@/lib/analytics";
import { primaryImage } from "@/lib/catalog";
import { formatMoney, money } from "@/lib/money";
import type { Cart, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";
import { Icon } from "../ui/Icon";
import { DrawerLink } from "./CartClientBits";
import { useCartUi } from "./CartProvider";

const initial: AddToCartState = { status: "idle" };

/** Uses the server-priced cart; recommendations never add themselves or choose an ambiguous variant. */
export function ShippingReward({ cart, threshold, shippingCents, suggestions, children }: {
  cart: Cart;
  threshold: number;
  shippingCents: number;
  suggestions: Product[];
  children: ReactNode;
}) {
  const [state, action, pending] = useActionState(addToCartAction, initial);
  const handled = useRef<number | null>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const { announce } = useCartUi();
  const remaining = Math.max(0, threshold - cart.totalQuantity);
  const unlocked = remaining === 0 && cart.shipping.status === "at-checkout" && cart.shipping.amount?.amount === 0;
  const savings = formatMoney(money(shippingCents));

  useEffect(() => {
    if (state.status === "idle" || handled.current === state.at) return;
    handled.current = state.at;
    announce(state.message);
    if (state.status === "success") {
      track("add_to_cart", { currency: state.item.currency, value: state.item.price, items: [state.item] });
      // Keep keyboard focus inside the bag when the recommendation button disappears.
      rewardRef.current?.focus({ preventScroll: true });
    }
  }, [state, announce]);

  if (!threshold || !shippingCents || !cart.totalQuantity) return children;

  return <>
    <div ref={rewardRef} tabIndex={-1} className={`shipping-reward mt-5 p-4 outline-none focus-visible:ring-2 focus-visible:ring-green ${unlocked ? "shipping-reward-unlocked" : "bg-night text-white"}`}>
      <div className="flex items-start gap-3" aria-live="polite" aria-atomic="true">
        <Icon name={unlocked ? "check" : "truck"} size={22} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-snug">{unlocked ? "Free shipping unlocked." : `You’re ${remaining} hat${remaining === 1 ? "" : "s"} away from free shipping.`}</p>
          <p className={`mt-1 text-sm leading-relaxed ${unlocked ? "text-green" : "text-white/80"}`}>
            {unlocked ? `Shipping’s on us. You saved ${savings} on this order.` : `Make it a pair and save ${savings} on U.S. shipping.`}
          </p>
        </div>
      </div>
      <div role="progressbar" aria-label="Hats toward free shipping" aria-valuemin={0} aria-valuemax={threshold} aria-valuenow={Math.min(cart.totalQuantity, threshold)} aria-valuetext={unlocked ? "Free shipping unlocked" : `${cart.totalQuantity} of ${threshold} hats`} className={`mt-3 h-1.5 overflow-hidden rounded-full ${unlocked ? "bg-green/15" : "bg-white/25"}`}>
        <div className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${unlocked ? "bg-green" : "bg-white"}`} style={{ width: `${Math.min(100, cart.totalQuantity / threshold * 100)}%` }} />
      </div>
    </div>

    {children}

    {!unlocked && remaining > 0 && <section aria-label="Add another hat for free shipping" className="border-t hairline pb-5 pt-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="font-semibold">Make it a pair</h3>
        <DrawerLink href="/shop" className="link text-sm">See all hats</DrawerLink>
      </div>
      <ul className="space-y-3">
        {suggestions.map(product => {
          const variant = product.variants[0];
          return <li key={product.id} className="flex items-center gap-3 rounded-sm border hairline p-2">
            <DrawerLink href={`/products/${product.slug}`} className="w-20 shrink-0" tabIndex={-1} aria-hidden="true">
              <ProductImage image={primaryImage(product)} sizes="80px" alt="" />
            </DrawerLink>
            <div className="min-w-0 flex-1"><DrawerLink href={`/products/${product.slug}`} className="text-sm font-semibold leading-snug hover:underline">{product.name}</DrawerLink><p className="mt-1 text-sm text-ink-soft">{product.fit.label}</p></div>
            <form action={action} className="shrink-0">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="colorId" value={variant.colorId} />
              <input type="hidden" name="quantity" value="1" />
              <button type="submit" disabled={pending} aria-busy={pending} aria-label={`Add ${product.name} for ${formatMoney(variant.price)}`} className="btn btn-dark min-h-11 px-3 text-sm disabled:opacity-50">
                {pending ? "Adding…" : `Add · ${formatMoney(variant.price)}`}
              </button>
            </form>
          </li>;
        })}
      </ul>
      {state.status === "error" && <p role="alert" className="mt-3 text-sm text-alert">{state.message}</p>}
      <p className="mt-3 text-sm text-ink-soft">Mix any two designs. Each hat is made to order.</p>
    </section>}
  </>;
}
