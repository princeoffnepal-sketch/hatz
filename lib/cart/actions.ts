"use server";

import { redirect } from "next/navigation";
import { findVariant, findVariantById } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog.server";
import { beginCheckout } from "@/lib/checkout/adapter.server";
import { addLine, CartError, clampQuantity, MAX_LINE_QUANTITY, removeLine, setLineQuantity } from "./core";
import { getCart, readStoredCart, writeStoredCart } from "./server";

/** Analytics-safe item payload: IDs, price and quantity only. */
export type CartItemEvent = {
  item_id: string;
  item_variant: string;
  item_name: string;
  price: number;
  quantity: number;
  currency: string;
};

export type AddToCartState =
  | { status: "idle" }
  | { status: "success"; message: string; item: CartItemEvent; at: number }
  | { status: "error"; message: string; field?: "color" | "size" | "quantity"; at: number };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length <= 100 ? value : null;
}

export async function addToCartAction(_prev: AddToCartState, formData: FormData): Promise<AddToCartState> {
  const at = Date.now();
  const product = getProducts().find((p) => p.id === text(formData, "productId"));
  if (!product) return { status: "error", message: "This design is no longer available.", at };

  const colorId = text(formData, "colorId");
  const sizeId = text(formData, "sizeId");
  if (!colorId || !product.colors.some((c) => c.id === colorId)) {
    return { status: "error", message: "Choose a color.", field: "color", at };
  }
  if (product.sizes.length && (!sizeId || !product.sizes.some((s) => s.id === sizeId))) {
    return { status: "error", message: "Choose a size.", field: "size", at };
  }
  const variant = findVariant(product, colorId, sizeId);
  if (!variant) return { status: "error", message: "That combination isn't offered.", at };
  if (!variant.available) {
    return {
      status: "error",
      message: `${variant.availabilityNote ?? "This option is temporarily unavailable"}. Choose another option.`,
      at,
    };
  }

  const quantity = clampQuantity(Number(text(formData, "quantity") ?? 1));
  try {
    const lines = await readStoredCart();
    const existing = lines.find((l) => l.v === variant.id)?.q ?? 0;
    if (existing >= MAX_LINE_QUANTITY) {
      return { status: "error", message: `You can order up to ${MAX_LINE_QUANTITY} of one option.`, field: "quantity", at };
    }
    await writeStoredCart(addLine(lines, variant.id, quantity));
  } catch (error) {
    const message = error instanceof CartError ? error.message : "We couldn't add this to your bag. Please try again.";
    return { status: "error", message, at };
  }

  const color = product.colors.find((c) => c.id === colorId)!;
  const size = product.sizes.find((s) => s.id === sizeId);
  return {
    status: "success",
    message: `Added ${product.name}, ${[color.name, size?.name].filter(Boolean).join(", ")} to your bag.`,
    item: {
      item_id: product.id,
      item_variant: variant.id,
      item_name: product.name,
      price: variant.price.amount / 100,
      quantity,
      currency: variant.price.currency,
    },
    at,
  };
}

export type LineUpdateState = { message: string; at: number } | null;

/** Handles quantity changes and removal. `intent` is "set", "increment", "decrement" or "remove". */
export async function updateLineAction(_prev: LineUpdateState, formData: FormData): Promise<LineUpdateState> {
  const at = Date.now();
  const variantId = text(formData, "variantId");
  const intent = text(formData, "intent") ?? "set";
  const lines = await readStoredCart();
  const line = lines.find((l) => l.v === variantId);
  if (!variantId || !line) return { message: "That item is no longer in your bag.", at };

  const match = findVariantById(getProducts(), variantId);
  const name = match ? match.product.name : "Item";

  let next = lines;
  if (intent === "remove") {
    next = removeLine(lines, variantId);
  } else {
    const requested =
      intent === "increment" ? line.q + 1 : intent === "decrement" ? line.q - 1 : Number(text(formData, "quantity"));
    if (!Number.isFinite(requested)) return { message: "Enter a valid quantity.", at };
    if (intent === "increment" && line.q >= MAX_LINE_QUANTITY) {
      return { message: `You can order up to ${MAX_LINE_QUANTITY} of one option.`, at };
    }
    next = setLineQuantity(lines, variantId, requested);
  }
  await writeStoredCart(next);

  const updated = next.find((l) => l.v === variantId);
  return { message: updated ? `${name} quantity updated to ${updated.q}.` : `${name} removed from your bag.`, at };
}

export type CheckoutState =
  | { kind: "idle" }
  | { kind: "preview"; reasons: string[]; at: number }
  | { kind: "error"; message: string; at: number };

export async function checkoutAction(): Promise<CheckoutState> {
  const result = await beginCheckout(await getCart());
  if (result.kind === "redirect") redirect(result.url);
  return { ...result, at: Date.now() };
}
