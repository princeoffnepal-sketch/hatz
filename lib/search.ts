import type { Product } from "./types";

/** Minimal public fields used by the search dialog. Safe to send to the browser. */
export type SearchEntry = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: Product["price"];
  fitLabel: string;
  colors: string[];
  image: { src: string; alt: string; kind: string } | null;
  haystack: string;
};

export function toSearchEntry(product: Product, image: SearchEntry["image"]): SearchEntry {
  const colors = product.colors.map((c) => c.name);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    price: product.price,
    fitLabel: product.fit.label,
    colors,
    image,
    haystack: normalize(
      [product.name, product.tagline, product.fit.label, product.fit.family, ...colors, ...product.sizes.map((s) => s.name), ...product.tags].join(" "),
    ),
  };
}

export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every query term must match. Terms match word prefixes, so "for" finds
 * "Forest"; numbers also match padded design numbers, so "1" finds "Design 01".
 */
export function searchEntries(entries: SearchEntry[], query: string): SearchEntry[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (!terms.length) return [];
  return entries
    .map((entry) => {
      const words = entry.haystack.split(" ");
      let score = 0;
      for (const term of terms) {
        const padded = /^\d$/.test(term) ? `0${term}` : term;
        const hit = words.findIndex((w) => w.startsWith(term) || w === padded);
        if (hit < 0) return null;
        score += words[hit] === term || words[hit] === padded ? 2 : 1;
        if (normalize(entry.name).includes(term)) score += 2;
      }
      return { entry, score };
    })
    .filter((r): r is { entry: SearchEntry; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry);
}
