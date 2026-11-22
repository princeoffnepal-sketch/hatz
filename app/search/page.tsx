import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product/ProductCard";
import { getProducts } from "@/lib/catalog.server";
import { searchEntries, toSearchEntry } from "@/lib/search";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).q;
  const query = (typeof raw === "string" ? raw : "").slice(0, 100);
  const products = getProducts();
  const entries = products.map((p) => toSearchEntry(p, null));
  const ids = searchEntries(entries, query).map((e) => e.id);
  const results = ids.map((id) => products.find((p) => p.id === id)!);

  return (
    <>
      <form role="search" action="/search" className="flex max-w-xl gap-2">
        <label htmlFor="search-q" className="sr-only">
          Search designs
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={query}
          key={query}
          className="field"
          placeholder="Search by design, color or fit"
          enterKeyHint="search"
        />
        <button type="submit" className="btn btn-dark">
          Search
        </button>
      </form>
      <p role="status" className="mt-6 text-ink-soft">
        {query
          ? results.length
            ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${query}”`
            : `No designs match “${query}”.`
          : "Enter a design name, color or fit, such as “Forest” or “Structured”."}
      </p>
      <div className="mt-8">
        {results.length > 0 ? (
          <ProductGrid products={results} listId="search_results" priorityCount={2} />
        ) : (
          query && (
            <div>
              <p className="text-sm text-ink-soft">Check the spelling or try a broader term.</p>
              <Link href="/shop" className="btn btn-outline mt-5">
                Browse all hats
              </Link>
            </div>
          )
        )}
      </div>
    </>
  );
}

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="container-site pt-10 md:pt-14">
      <h1 className="display mb-6 text-5xl sm:text-6xl">Search</h1>
      <Suspense fallback={<div className="h-40" aria-hidden="true" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
