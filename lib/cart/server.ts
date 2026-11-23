import "server-only";
import { cookies } from "next/headers";
import { delivery } from "@/config/delivery";
import { getProducts } from "@/lib/catalog.server";
import type { Cart } from "@/lib/types";
import { buildCart, parseStoredCart, serializeStoredCart, type StoredLine } from "./core";

export const CART_COOKIE = "cart";
export const CHECKOUT_COOKIE = "eh_checkout";
export const CART_ID_COOKIE = "eh_cart_id";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function readStoredCart(): Promise<StoredLine[]> {
  const store = await cookies();
  return parseStoredCart(store.get(CART_COOKIE)?.value);
}

/** Must be called from a Server Action or Route Handler. */
export async function writeStoredCart(lines: StoredLine[]) {
  const store = await cookies();
  if (!lines.length) {
    store.delete(CART_COOKIE);
    store.delete(CART_ID_COOKIE);
    store.delete(CHECKOUT_COOKIE);
    return;
  }
  if (!/^[a-f0-9]{64}$/.test(store.get(CART_ID_COOKIE)?.value??"")) store.set(CART_ID_COOKIE,crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-",""),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:THIRTY_DAYS});
  store.set(CART_COOKIE, serializeStoredCart(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function getCart(): Promise<Cart> {
  return buildCart(await readStoredCart(), getProducts(), delivery);
}
