import "server-only";
import { getCommerceConfig } from "@/config/commerce.server";
import { catalog } from "@/data/catalog";
import { isVisibleInMode } from "./catalog";
import type { Product } from "./types";

/**
 * Products visible in the current store mode. Demo products appear only in
 * demo mode; live and stripe-test modes show published products only, so
 * placeholders can't be sold accidentally.
 */
export function getProducts(): Product[] {
  const { mode } = getCommerceConfig();
  return catalog.filter((p) => isVisibleInMode(p, mode));
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function isDemoCatalog(): boolean {
  return getProducts().some((p) => p.status === "demo");
}
