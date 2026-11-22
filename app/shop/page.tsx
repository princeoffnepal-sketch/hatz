import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product/ProductCard";
import { ShopControls } from "@/components/shop/ShopControls";
import { fitFamilies } from "@/data/catalog";
import { filterProducts, parseSort, sortProducts } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog.server";

export const metadata: Metadata = {
  title: "Shop all hats",
  description: "Every design, made after you order.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const all = getProducts();
  const sort = parseSort(one(params.sort));
  const fitIds = Object.keys(fitFamilies);
  const colorMap = new Map(all.flatMap((p) => p.colors).map((c) => [c.id, c]));
  const fit = fitIds.includes(one(params.fit) ?? "") ? one(params.fit) : null;
  const color = colorMap.has(one(params.color) ?? "") ? one(params.color) : null;
  const products = sortProducts(filterProducts(all, { fit, color }), sort);
  const active: { label: string; clear: Record<string, string | null> }[] = [];
  if (fit) active.push({ label: fitFamilies[fit as keyof typeof fitFamilies].name, clear: { color, sort } });
  if (color) active.push({ label: colorMap.get(color)!.name, clear: { fit, sort } });

  const href = (q: Record<string, string | null>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v && !(k === "sort" && v === "featured")) p.set(k, v);
    const s = p.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return (
    <>
      <div className="flex flex-col gap-5 border-y hairline py-4 md:flex-row md:items-end md:justify-between">
        <ShopControls
          sort={sort}
          fit={fit}
          color={color}
          fits={Object.values(fitFamilies).map((f) => ({ id: f.id, name: f.name }))}
          colors={[...colorMap.values()].map((c) => ({ id: c.id, name: c.name }))}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <p role="status" aria-live="polite" className="text-ink-soft">
            {products.length} {products.length === 1 ? "design" : "designs"}
          </p>
          {active.map((a) => (
            <Link
              key={a.label}
              href={href(a.clear)}
              scroll={false}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ink px-3 text-sm transition-colors hover:bg-ink hover:text-ivory"
            >
              {a.label} <span aria-hidden="true">×</span>
              <span className="sr-only">(remove filter)</span>
            </Link>
          ))}
          {active.length > 1 && (
            <Link href={href({ sort })} scroll={false} className="link ml-1">
              Clear all
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8">
        {products.length ? (
          <ProductGrid products={products} listId="shop_all" priorityCount={4} />
        ) : (
          <div className="py-16 text-center">
            <p className="display text-3xl">No designs match those filters.</p>
            <p className="mt-2 text-ink-soft">Try a different fit or color.</p>
            <Link href="/shop" className="btn btn-outline mt-6">
              Reset filters
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const count = getProducts().length;
  return (
    <div className="container-site pt-10 md:pt-14">
      <div className="mb-8 max-w-2xl">
        <h1 className="display text-5xl sm:text-6xl">All hats</h1>
        <p className="mt-3 text-ink-soft">
          {count} snapbacks. $65 each. Free U.S. shipping with 2+ hats. Colors exactly as photographed.
        </p>
      </div>
      <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
