import type { ImageRole, Product, ProductImageData, Variant } from "./types";

/** Demo products are visible only in demo mode; other modes show published products only. */
export function isVisibleInMode(product: Pick<Product, "status">, mode: string | undefined) {
  const demo = mode !== "stripe-test" && mode !== "live";
  return demo ? product.status !== "draft" : product.status === "published";
}

const ROLE_ORDER: ImageRole[] = ["front", "worn", "side", "back", "detail", "inside"];

export function findVariant(
  product: Product,
  colorId: string | null | undefined,
  sizeId: string | null | undefined,
): Variant | undefined {
  if (!colorId) return undefined;
  const needsSize = product.sizes.length > 0;
  if (needsSize && !sizeId) return undefined;
  return product.variants.find(
    (v) => v.colorId === colorId && (needsSize ? v.sizeId === sizeId : v.sizeId === null),
  );
}

export function findVariantById(products: Product[], variantId: string) {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

/** Images for a color: color-specific images plus shared ones, in shot-list order. */
export function imagesForColor(product: Product, colorId: string | null | undefined): ProductImageData[] {
  const matching = product.images.filter((img) => !img.colorId || img.colorId === colorId);
  const list = matching.length ? matching : product.images.filter((img) => !img.colorId);
  return [...list].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
}

export function primaryImage(product: Product, colorId?: string | null): ProductImageData | null {
  return imagesForColor(product, colorId ?? product.colors[0]?.id)[0] ?? product.images[0] ?? null;
}

/** A second, different-role image for hover previews; only when it's a real photo. */
export function secondaryPhoto(product: Product, colorId?: string | null): ProductImageData | null {
  const images = imagesForColor(product, colorId ?? product.colors[0]?.id);
  const second = images.find((img) => img.role === "worn") ?? images[1];
  return second && second.kind === "photo" ? second : null;
}

/** Default color: first color with any available variant. */
export function defaultColorId(product: Product): string | null {
  const color = product.colors.find((c) => product.variants.some((v) => v.colorId === c.id && v.available));
  return color?.id ?? product.colors[0]?.id ?? null;
}

export function isColorAvailable(product: Product, colorId: string) {
  return product.variants.some((v) => v.colorId === colorId && v.available);
}

export function isSizeAvailable(product: Product, colorId: string | null, sizeId: string) {
  return product.variants.some(
    (v) => v.sizeId === sizeId && v.available && (!colorId || v.colorId === colorId),
  );
}

/** Products that require an explicit choice beyond color (e.g. size) before adding. */
export function requiresChoice(product: Product) {
  return product.sizes.length > 0 || product.colors.length > 1;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name" },
];

export function parseSort(value: unknown): SortKey {
  return SORT_OPTIONS.some((o) => o.value === value) ? (value as SortKey) : "featured";
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price.amount - b.price.amount || a.featuredRank - b.featuredRank);
    case "price-desc":
      return list.sort((a, b) => b.price.amount - a.price.amount || a.featuredRank - b.featuredRank);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list.sort((a, b) => a.featuredRank - b.featuredRank);
  }
}

export type ProductFilters = { fit?: string | null; color?: string | null };

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter(
    (p) =>
      (!filters.fit || p.fit.family === filters.fit) &&
      (!filters.color || p.colors.some((c) => c.id === filters.color)),
  );
}

export function relatedProducts(products: Product[], product: Product, count = 3): Product[] {
  return products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const aScore = Number(a.fit.family === product.fit.family);
      const bScore = Number(b.fit.family === product.fit.family);
      return bScore - aScore || a.featuredRank - b.featuredRank;
    })
    .slice(0, count);
}

/**
 * Structural problems that would break the storefront (bad references, missing
 * imagery). Run in tests and the launch gate; independent of launch readiness.
 */
export function validateProduct(product: Product): string[] {
  const issues: string[] = [];
  const colorIds = new Set(product.colors.map((c) => c.id));
  const sizeIds = new Set(product.sizes.map((s) => s.id));
  if (!product.slug) issues.push(`${product.id}: missing slug`);
  if (!product.name) issues.push(`${product.id}: missing name`);
  if (!product.colors.length) issues.push(`${product.id}: no colors`);
  if (!product.variants.length) issues.push(`${product.id}: no variants`);
  if (!Number.isInteger(product.price.amount) || product.price.amount <= 0) {
    issues.push(`${product.id}: invalid price`);
  }
  for (const variant of product.variants) {
    if (!colorIds.has(variant.colorId)) issues.push(`${variant.id}: unknown color ${variant.colorId}`);
    if (product.sizes.length && (!variant.sizeId || !sizeIds.has(variant.sizeId))) {
      issues.push(`${variant.id}: missing or unknown size`);
    }
    if (variant.price.currency !== product.price.currency) issues.push(`${variant.id}: currency mismatch`);
  }
  for (const color of product.colors) {
    if (!imagesForColor(product, color.id).length) issues.push(`${product.id}: no image for ${color.name}`);
  }
  for (const image of product.images) {
    if (!image.alt.trim()) issues.push(`${product.id}: image ${image.src} has no alt text`);
    if (image.colorId && !colorIds.has(image.colorId)) issues.push(`${image.src}: unknown color`);
  }
  return issues;
}

/** Content that must be real before a product can be sold. */
export function productLaunchIssues(product: Product): string[] {
  const issues: string[] = [];
  if (product.status !== "published") issues.push(`${product.name}: status is "${product.status}"`);
  if (product.images.some((img) => img.kind !== "photo" || !img.approved)) {
    issues.push(`${product.name}: uses placeholder or unapproved imagery`);
  }
  if (!product.description.verified) issues.push(`${product.name}: description not verified`);
  if (!product.fit.verified) issues.push(`${product.name}: fit specifications not verified`);
  if (product.fit.adjustable && !product.fit.measuredRange) {
    issues.push(`${product.name}: adjustable range not measured`);
  }
  if (!product.construction.verified) issues.push(`${product.name}: construction details not verified`);
  return issues;
}
