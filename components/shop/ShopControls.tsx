"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { SORT_OPTIONS, type SortKey } from "@/lib/catalog";

/**
 * Filter and sort as a plain GET form so state lives in the URL and works
 * without JavaScript. With JavaScript, changes apply immediately.
 */
export function ShopControls({
  sort,
  fit,
  color,
  fits,
  colors,
}: {
  sort: SortKey;
  fit: string | null;
  color: string | null;
  fits: { id: string; name: string }[];
  colors: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function apply() {
    const form = formRef.current;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === "string" && value && !(key === "sort" && value === "featured")) params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }

  return (
    <form
      ref={formRef}
      action="/shop"
      onChange={apply}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex flex-wrap items-end gap-3"
    >
      {fits.length > 1 && <div>
        <label htmlFor="shop-fit" className="mb-1 block text-xs font-semibold text-ink-soft">
          Fit
        </label>
        <select id="shop-fit" name="fit" defaultValue={fit ?? ""} key={`fit-${fit}`} className="field min-h-11 w-auto py-2 text-sm">
          <option value="">All fits</option>
          {fits.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>}
      {colors.length > 1 && <div>
        <label htmlFor="shop-color" className="mb-1 block text-xs font-semibold text-ink-soft">
          Color
        </label>
        <select id="shop-color" name="color" defaultValue={color ?? ""} key={`color-${color}`} className="field min-h-11 w-auto py-2 text-sm">
          <option value="">All colors</option>
          {colors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>}
      <div>
        <label htmlFor="shop-sort" className="mb-1 block text-xs font-semibold text-ink-soft">
          Sort
        </label>
        <select id="shop-sort" name="sort" defaultValue={sort} key={`sort-${sort}`} className="field min-h-11 w-auto py-2 text-sm">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <noscript>
        <button type="submit" className="btn btn-outline min-h-11 py-2">
          Apply
        </button>
      </noscript>
    </form>
  );
}
