import Link from "next/link";
import { Suspense } from "react";
import { site } from "@/config/site";
import { primaryImage } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog.server";
import { getCart } from "@/lib/cart/server";
import { toSearchEntry } from "@/lib/search";
import { Icon } from "../ui/Icon";
import { BagButton, MobileMenu, NavLinks, SearchButton } from "./HeaderClient";
import { Wordmark } from "./Wordmark";

async function BagCount() {
  const cart = await getCart();
  return <BagButton count={cart.totalQuantity} />;
}

export function ServiceStrip() {
  return (
    <div className="bg-night text-ivory on-dark">
      <p className="container-site flex min-h-9 items-center justify-center gap-1.5 text-center text-[0.8125rem]">
        <span>{site.serviceStrip.text}</span>
        <Link href={site.serviceStrip.href} className="link inline-flex items-center gap-1 font-semibold">
          {site.serviceStrip.linkLabel}
        </Link>
      </p>
    </div>
  );
}

export function Header() {
  const entries = getProducts().map((p) => {
    const img = primaryImage(p);
    return toSearchEntry(p, img ? { src: img.src, alt: img.alt, kind: img.kind } : null);
  });

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-ivory/92 backdrop-blur-md supports-[backdrop-filter]:bg-ivory/80">
      <div className="container-site grid h-16 grid-cols-[1fr_auto_1fr] items-center md:flex md:h-[4.5rem] md:gap-8">
        <div className="flex items-center md:hidden">
          <MobileMenu />
        </div>
        <Link href="/" className="justify-self-center md:justify-self-auto" aria-label={`${site.name} home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks />
        </nav>
        <div className="flex items-center justify-end gap-0.5 md:ml-auto md:gap-2">
          <SearchButton entries={entries} />
          <Suspense fallback={<BagButton count={null} />}>
            <BagCount />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
