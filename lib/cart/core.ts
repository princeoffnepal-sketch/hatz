import type { DeliverySettings } from "@/config/delivery";
import { findVariantById, primaryImage } from "@/lib/catalog";
import { shippingPriceFor } from "@/lib/delivery";
import { money, multiply, sum } from "@/lib/money";
import type { Cart, CartLine, Product, ShippingQuote } from "@/lib/types";

/**
 * The persisted cart is only variant IDs and quantities. Names, prices and
 * images are always re-derived from the server catalog, so a tampered or
 * stale cookie can't change what a customer pays.
 */
export type StoredLine = { v: string; q: number };

export const MAX_LINE_QUANTITY = 10;
export const MAX_LINES = 20;

export function clampQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.trunc(quantity)));
}

export function parseStoredCart(raw: string | undefined | null): StoredLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const merged = new Map<string, number>();
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as StoredLine).v === "string" &&
        (item as StoredLine).v.length <= 100 &&
        typeof (item as StoredLine).q === "number" &&
        (item as StoredLine).q >= 1
      ) {
        const { v, q } = item as StoredLine;
        merged.set(v, clampQuantity((merged.get(v) ?? 0) + q));
      }
    }
    return [...merged].slice(0, MAX_LINES).map(([v, q]) => ({ v, q }));
  } catch {
    return [];
  }
}

export function serializeStoredCart(lines: StoredLine[]): string {
  return JSON.stringify(lines.map(({ v, q }) => ({ v, q })));
}

export function addLine(lines: StoredLine[], variantId: string, quantity: number): StoredLine[] {
  const existing = lines.find((l) => l.v === variantId);
  if (existing) {
    return lines.map((l) => (l.v === variantId ? { v: l.v, q: clampQuantity(l.q + quantity) } : l));
  }
  if (lines.length >= MAX_LINES) throw new CartError("Your bag is full. Remove an item to add another.");
  return [...lines, { v: variantId, q: clampQuantity(quantity) }];
}

export function setLineQuantity(lines: StoredLine[], variantId: string, quantity: number): StoredLine[] {
  if (quantity <= 0) return removeLine(lines, variantId);
  return lines.map((l) => (l.v === variantId ? { v: l.v, q: clampQuantity(quantity) } : l));
}

export function removeLine(lines: StoredLine[], variantId: string): StoredLine[] {
  return lines.filter((l) => l.v !== variantId);
}

export class CartError extends Error {}

function shippingQuote(settings: DeliverySettings, subtotalCents: number, totalQuantity: number): ShippingQuote {
  const service = settings.services[0];
  if (service?.freeMinQuantity && totalQuantity >= service.freeMinQuantity) {
    return { status: "at-checkout", amount: money(0), message: "Free U.S. shipping unlocked with 2 or more hats." };
  }
  if (!service || service.priceCents === null) {
    return {
      status: "unconfigured",
      message:
        "Shipping price and delivery estimate aren't configured yet. They'll be confirmed with our production partner before launch.",
    };
  }
  return {
    status: "at-checkout",
    amount: money(shippingPriceFor(service, subtotalCents, totalQuantity)),
    message: service.freeMinQuantity && totalQuantity === 1 ? "U.S. shipping. Add one more hat for free shipping." : `${service.label}. Your shipping address is confirmed at checkout.`,
  };
}

/** Resolves stored lines against the catalog and computes totals. */
export function buildCart(stored: StoredLine[], products: Product[], settings: DeliverySettings): Cart {
  const lines: CartLine[] = [];
  const removedLines: Cart["removedLines"] = [];

  for (const { v, q } of stored) {
    const match = findVariantById(products, v);
    if (!match) {
      removedLines.push({ variantId: v, reason: "This item is no longer offered." });
      continue;
    }
    const { product, variant } = match;
    const color = product.colors.find((c) => c.id === variant.colorId);
    const size = product.sizes.find((s) => s.id === variant.sizeId);
    const quantity = clampQuantity(q);
    lines.push({
      id: variant.id,
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colorName: color?.name ?? variant.colorId,
      sizeName: size?.name ?? null,
      quantity,
      unitPrice: variant.price,
      lineTotal: multiply(variant.price, quantity),
      image: primaryImage(product, variant.colorId),
      available: variant.available,
    });
  }

  // Unavailable lines stay visible so the customer can see and remove them,
  // but they don't count toward the total and they block checkout.
  const payable = lines.filter((l) => l.available);
  const subtotal = sum(payable.map((l) => l.lineTotal));
  return {
    lines,
    totalQuantity: payable.reduce((n, l) => n + l.quantity, 0),
    subtotal,
    discounts: [],
    shipping: shippingQuote(settings, subtotal.amount, payable.reduce((n, l) => n + l.quantity, 0)),
    removedLines,
  };
}

export function cartHasBlockingLines(cart: Cart) {
  return cart.lines.some((l) => !l.available);
}
