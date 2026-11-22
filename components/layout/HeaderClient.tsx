"use client";

import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useId, useRef, useState } from "react";
import { site } from "@/config/site";
import { formatMoney } from "@/lib/money";
import { searchEntries, type SearchEntry } from "@/lib/search";
import { useCartUi } from "../cart/CartProvider";
import { Icon } from "../ui/Icon";
import { Sheet } from "../ui/Sheet";

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) || (href === "/shop" && pathname.startsWith("/products/"));
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {site.nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative inline-flex min-h-11 items-center px-3 text-[0.9375rem] font-medium after:absolute after:inset-x-3 after:bottom-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100 aria-[current=page]:after:scale-x-100"
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BagButton({ count }: { count: number | null }) {
  const { openDrawer } = useCartUi();
  const ref = useRef<HTMLAnchorElement>(null);
  const label = count === null ? "Bag" : `Bag, ${count} ${count === 1 ? "item" : "items"}`;
  return (
    <a
      ref={ref}
      href="/cart"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        openDrawer(ref.current);
      }}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2 transition-colors hover:bg-ivory-deep"
    >
      <Icon name="bag" size={22} />
      <span className="hidden text-[0.9375rem] font-medium lg:inline">Bag</span>
      <AnimatePresence initial={false}>
        {count !== null && count > 0 && (
          <m.span
            key={count}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 26 }}
            className="absolute right-0 top-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-green px-1 text-[0.6875rem] font-semibold leading-[1.15rem] text-ivory tabular-nums lg:static lg:min-w-5 lg:leading-5"
            aria-hidden="true"
          >
            {count}
          </m.span>
        )}
      </AnimatePresence>
    </a>
  );
}

function SearchResults({ entries, query, onNavigate }: { entries: SearchEntry[]; query: string; onNavigate: () => void }) {
  const results = searchEntries(entries, query);
  if (!query.trim()) {
    return (
      <div className="px-5 py-6">
        <p className="text-sm font-semibold">Try</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {["Relaxed", "Structured", "Forest", "Bone", "Sized"].map((term) => (
            <li key={term}>
              <Link
                href={`/search?q=${encodeURIComponent(term)}`}
                onClick={onNavigate}
                className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm transition-colors hover:border-ink"
              >
                {term}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="px-5 py-4">
      <p className="text-sm text-ink-soft" role="status" aria-live="polite">
        {results.length ? `${results.length} ${results.length === 1 ? "design" : "designs"} found` : `No designs match “${query}”.`}
      </p>
      {results.length > 0 ? (
        <ul className="mt-3 divide-y divide-line">
          {results.slice(0, 6).map((r) => (
            <li key={r.id}>
              <Link href={`/products/${r.slug}`} onClick={onNavigate} className="flex items-center gap-4 py-3 hover:bg-ivory-deep/60">
                <span className="frame block h-16 w-[3.2rem] shrink-0">
                  {/* Small thumbnail; decorative next to the text link. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {r.image && <img src={r.image.src} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{r.name}</span>
                  <span className="block truncate text-sm text-ink-soft">
                    {r.fitLabel} · {r.colors.join(", ")}
                  </span>
                </span>
                <span className="text-sm tabular-nums">{formatMoney(r.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Link href="/shop" onClick={onNavigate} className="link-arrow mt-4 text-sm">
          Browse all hats
        </Link>
      )}
    </div>
  );
}

export function SearchButton({ entries }: { entries: SearchEntry[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const inputId = useId();
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <a
        href="/search"
        aria-haspopup="dialog"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey) return;
          event.preventDefault();
          setOpen(true);
        }}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2 transition-colors hover:bg-ivory-deep"
      >
        <Icon name="search" size={21} />
        <span className="sr-only lg:not-sr-only lg:text-[0.9375rem] lg:font-medium">Search</span>
      </a>
      <Sheet open={open} onClose={close} side="top" title="Search" hideTitle initialFocusRef={inputRef}>
        <div className="container-site max-w-3xl">
          <form
            role="search"
            action="/search"
            onSubmit={(event) => {
              event.preventDefault();
              close();
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="flex items-center gap-3 border-b hairline px-5 py-3"
          >
            <label htmlFor={inputId} className="sr-only">
              Search designs
            </label>
            <Icon name="search" size={20} className="shrink-0 text-ink-soft" />
            <input
              ref={inputRef}
              id={inputId}
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Native search inputs swallow the first Escape to clear text; close the dialog instead.
                if (e.key === "Escape") {
                  e.preventDefault();
                  close();
                }
              }}
              placeholder="Search by design, color or fit"
              autoComplete="off"
              enterKeyHint="search"
              className="min-h-12 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-soft/70"
            />
          </form>
          <SearchResults entries={entries} query={deferred} onNavigate={close} />
        </div>
      </Sheet>
    </>
  );
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const pathname = usePathname();
  const searchId = useId();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-ivory-deep md:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <Icon name="menu" size={22} />
      </button>
      <Sheet open={open} onClose={close} side="left" title="Menu">
        <nav aria-label="Mobile" className="px-5 py-6">
          <ul className="space-y-1">
            {[{ label: "Home", href: "/" }, ...site.nav].map((item, i) => (
              <li key={item.href} className="enter" style={{ animationDelay: open ? `${60 + i * 40}ms` : undefined }}>
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={isActive(pathname, item.href) || pathname === item.href ? "page" : undefined}
                  className="display flex min-h-12 items-center text-[2rem] aria-[current=page]:text-green"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <form role="search" action="/search" className="mt-8">
            <label htmlFor={searchId} className="text-sm font-semibold">
              Search
            </label>
            <div className="mt-2 flex gap-2">
              <input id={searchId} name="q" type="search" className="field" placeholder="Design, color or fit" enterKeyHint="search" />
              <button type="submit" className="btn btn-dark px-4" aria-label="Submit search">
                <Icon name="search" size={18} />
              </button>
            </div>
          </form>
          <ul className="mt-8 space-y-1 border-t hairline pt-6 text-[0.9375rem]">
            {[
              { label: "Shipping & delivery", href: "/shipping" },
              { label: "Returns & cancellations", href: "/returns" },
              { label: "Bag", href: "/cart" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close} className="flex min-h-11 items-center">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Sheet>
    </>
  );
}
