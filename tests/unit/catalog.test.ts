import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { findVariant, imagesForColor, productLaunchIssues, sortProducts, validateProduct } from "@/lib/catalog";
import type { Product } from "@/lib/types";

describe("photo catalog", () => {
  it("has five $50 and four $55 snapbacks", () => {
    const prices = catalog.map((p) => p.price.amount).sort();
    expect(prices).toEqual([5000,5000,5000,5000,5000,5500,5500,5500,5500]);
    for (const p of catalog) for (const v of p.variants) expect(v.price).toEqual(p.price);
  });

  it("contains real photos and no invented measurements", () => {
    expect(catalog.every((p) => p.status === "published" && p.description.verified && !p.fit.verified)).toBe(true);
  });

  it("passes structural validation", () => {
    expect(catalog.flatMap(validateProduct)).toEqual([]);
  });

  it("has unique product and variant IDs", () => {
    const ids = catalog.flatMap((p) => p.variants.map((v) => v.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(catalog.map((p) => p.slug)).size).toBe(catalog.length);
  });

  it("references image files that exist in /public", () => {
    const missing = catalog.flatMap((p) => p.images).filter((img) => !existsSync(join(process.cwd(), "public", img.src)));
    expect(missing.map((m) => m.src)).toEqual([]);
    expect(catalog.flatMap(p => p.images)).toHaveLength(35);
    expect(catalog.every(p => p.images.every(i => i.kind === "photo"))).toBe(true);
  });

  it("never includes private cost or supplier fields in public product data", () => {
    const keys = new Set<string>();
    const amounts = new Set<number>();
    const walk = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) {
          keys.add(k);
          if (k === "amount" && typeof v === "number") amounts.add(v);
          walk(v);
        }
      }
    };
    walk(catalog);
    expect([...keys].filter((k) => /cost|supplier|margin/i.test(k))).toEqual([]);
    expect([...amounts].sort()).toEqual([5000,5500]);
  });

  it("is blocked from launch while supplier specs remain unverified", () => {
    for (const p of catalog) expect(productLaunchIssues(p).length).toBeGreaterThan(0);
  });
});

describe("variant resolution", () => {
  const sized: Product = { ...catalog[0], sizes: [{ id: "lg-xl", name: "L/XL" }],
    variants: [{ ...catalog[0].variants[0], id: "test-sized", colorId: "as-shown", sizeId: "lg-xl" }] };
  const simple = catalog.find((p) => p.id === "design-01")!;

  it("requires a size for sized products and never substitutes one", () => {
    expect(findVariant(sized, "as-shown", null)).toBeUndefined();
    expect(findVariant(sized, "as-shown", "lg-xl")?.id).toBe("test-sized");
  });

  it("resolves single-size products by color alone", () => {
    expect(findVariant(simple, "as-shown", null)?.id).toBe("design-01-as-shown");
    expect(findVariant(simple, null, null)).toBeUndefined();
  });

  it("returns color-specific images in shot-list order", () => {
    const roles = imagesForColor(simple, "as-shown").map((i) => i.role);
    expect(roles).toEqual(["front", "front", "side", "side"]);
    expect(imagesForColor(simple, "as-shown").every((i) => i.colorId === "as-shown")).toBe(true);
  });

  it("sorts by price and featured rank", () => {
    expect(sortProducts(catalog, "price-asc")[0].price.amount).toBe(5000);
    expect(sortProducts(catalog, "price-desc")[0].price.amount).toBe(5500);
    expect(sortProducts(catalog, "featured")[0].id).toBe("design-01");
  });
});

describe("missing product data", () => {
  const base = catalog[0];
  const broken = (patch: Partial<Product>): Product => ({ ...base, ...patch });

  it("flags a color with no imagery", () => {
    const p = broken({ images: base.images.filter((i) => i.colorId !== "as-shown") });
    expect(validateProduct(p)).toContain("design-01: no image for Black / gold-tone");
  });

  it("flags variants pointing at unknown colors and missing alt text", () => {
    const p = broken({
      variants: [...base.variants, { ...base.variants[0], id: "x", colorId: "purple" }],
      images: [{ ...base.images[0], alt: " " }, ...base.images.slice(1)],
    });
    const issues = validateProduct(p);
    expect(issues).toContain("x: unknown color purple");
    expect(issues.some((i) => i.includes("no alt text"))).toBe(true);
  });

  it("flags missing names, colors and invalid prices", () => {
    const issues = validateProduct(broken({ name: "", colors: [], price: { amount: 0, currency: "USD" } }));
    expect(issues).toEqual(expect.arrayContaining(["design-01: missing name", "design-01: no colors", "design-01: invalid price"]));
  });
});
