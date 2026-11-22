import Link from "next/link";
import { getCart } from "@/lib/cart/server";
import { getCheckoutAvailability } from "@/lib/checkout/gate.server";
import { deliveryCopy } from "@/lib/disclosure";
import { formatMoney } from "@/lib/money";
import { policies } from "@/config/policies";
import { ProductImage } from "../ProductImage";
import { Icon } from "../ui/Icon";
import { CartViewTracker, DrawerLink } from "./CartClientBits";
import { CheckoutButton } from "./CheckoutButton";
import { LineControls } from "./LineControls";

/**
 * Server-rendered cart used by both the drawer and the full /cart page.
 * Lines, prices and totals are always computed on the server from the catalog.
 */
export async function CartView({ variant }: { variant: "drawer" | "page" }) {
  const cart = await getCart();
  const availability = getCheckoutAvailability();
  const copy = deliveryCopy();
  const isPage = variant === "page";

  if (!cart.lines.length) {
    return (
      <div className={`flex flex-col items-start ${isPage ? "py-10" : "p-5"}`}>
        {cart.removedLines.length > 0 && (
          <p className="notice mb-6 w-full">Some items were removed because they&apos;re no longer offered.</p>
        )}
        <p className="display text-3xl">Your bag is empty.</p>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          Every design is made after you order. Find one you like and it will be produced for you.
        </p>
        <DrawerLink href="/shop" className="btn btn-primary mt-6">
          Shop hats
        </DrawerLink>
      </div>
    );
  }

  return (
    <div className={isPage ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16" : "flex h-full flex-col"}>
      <CartViewTracker cart={cart} drawer={!isPage} />
      <div className={isPage ? "" : "flex-1 px-5"}>
        {cart.removedLines.length > 0 && (
          <p className="notice my-4">Some items were removed because they&apos;re no longer offered.</p>
        )}
        <ul className="divide-y divide-line" aria-label="Items in your bag">
          {cart.lines.map((line) => (
            <li key={line.id} className="grid grid-cols-[5.5rem_1fr] gap-4 py-5 sm:grid-cols-[7rem_1fr]">
              <DrawerLink href={`/products/${line.slug}`} tabIndex={-1} aria-hidden="true">
                <ProductImage image={line.image} alt="" sizes="112px" aspect="4 / 3" />
              </DrawerLink>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug">
                    <DrawerLink href={`/products/${line.slug}`} className="hover:underline">
                      {line.name}
                    </DrawerLink>
                  </h3>
                  <p className="shrink-0 font-semibold tabular-nums">{formatMoney(line.lineTotal)}</p>
                </div>
                <dl className="text-sm text-ink-soft">
                  <div className="flex gap-1">
                    <dt>Color:</dt>
                    <dd>{line.colorName}</dd>
                  </div>
                  {line.sizeName && (
                    <div className="flex gap-1">
                      <dt>Size:</dt>
                      <dd>{line.sizeName}</dd>
                    </div>
                  )}
                  {line.quantity > 1 && (
                    <div className="flex gap-1">
                      <dt>Each:</dt>
                      <dd className="tabular-nums">{formatMoney(line.unitPrice)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-2">
                  <LineControls line={line} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={isPage ? "lg:sticky lg:top-24 lg:self-start" : "border-t hairline bg-paper px-5 py-5"}>
        {isPage && <h2 className="mb-4 text-lg font-semibold">Order summary</h2>}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Subtotal ({cart.totalQuantity} {cart.totalQuantity === 1 ? "item" : "items"})</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(cart.subtotal)}</dd>
          </div>
          {cart.discounts.map((d) => (
            <div key={d.label} className="flex justify-between gap-4 text-green">
              <dt>{d.label}</dt>
              <dd className="tabular-nums">−{formatMoney(d.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4">
            <dt>Shipping</dt>
            <dd className="text-right tabular-nums">
              {cart.shipping.status === "unconfigured"
                ? "Not yet configured"
                : cart.shipping.amount
                  ? cart.shipping.amount.amount === 0
                    ? "Free"
                    : formatMoney(cart.shipping.amount)
                  : "Calculated at checkout"}
            </dd>
          </div>
          <p className="text-xs text-ink-soft">{cart.shipping.message}</p>
          <div className="flex justify-between gap-4">
            <dt>Taxes</dt>
            <dd className="text-right text-ink-soft">
              {availability.mode === "demo" ? "Not yet configured" : "Calculated at checkout if applicable"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border-t hairline pt-4 text-sm">
          <p className="flex gap-2 font-semibold">
            <Icon name="needle" size={18} className="mt-0.5 shrink-0 text-green" />
            Each hat is made or decorated after you order.
          </p>
          <p className="mt-1 pl-[1.625rem] text-ink-soft">
            {copy.production} {copy.configured && copy.splitNote}
          </p>
          <p className="mt-1 pl-[1.625rem] text-xs text-ink-soft">
            {policies.returns.summary}{" "}
            <DrawerLink href="/returns" className="link">
              Returns
            </DrawerLink>
          </p>
        </div>

        <div className="mt-5">
          <CheckoutButton cart={cart} availability={availability} />
        </div>
        {!isPage && (
          <DrawerLink href="/cart" className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold underline underline-offset-4">
            View full bag
          </DrawerLink>
        )}
        {isPage && (
          <p className="mt-4 text-xs text-ink-soft">
            No account needed. {availability.enabled ? "Payment is handled on a secure page hosted by Stripe." : ""}
          </p>
        )}
        {isPage && (
          <Link href="/shop" className="link-arrow mt-6 text-sm">
            Continue shopping
          </Link>
        )}
      </div>
    </div>
  );
}
