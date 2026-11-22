"use client";

import { useEffect, useId, useRef, useState } from "react";
import { defaultColorId, findVariant, imagesForColor } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { isDeliveryConfigured } from "@/lib/delivery";
import { delivery } from "@/config/delivery";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { DeliverySummary } from "../DeliverySummary";
import { AddToBagForm } from "./AddToBagForm";
import { Gallery } from "./Gallery";
import { StickyPurchaseBar } from "./StickyPurchaseBar";

/**
 * Product page gallery + purchase panel. Color selection drives the gallery,
 * price, availability and the add-to-bag payload together, and is mirrored
 * to `?color=` so a selection can be shared or restored.
 */
export function ProductExperience({ product }: { product: Product }) {
  const [colorId, setColorId] = useState<string | null>(() => defaultColorId(product));
  const [sizeId, setSizeId] = useState<string | null>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const disclosureRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const formId = `${uid}-form`;
  const optionsId = `${uid}-options`;
  const disclosureId = `${product.slug}-delivery`;

  // Restore ?color= from the URL after hydration.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("color");
    if (requested && product.colors.some((c) => c.id === requested)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColorId(requested);
    }
  }, [product.colors]);

  function changeColor(id: string) {
    setColorId(id);
    // Keep a chosen size if it exists for the new color; never substitute another size.
    const url = new URL(window.location.href);
    url.searchParams.set("color", id);
    window.history.replaceState(window.history.state, "", url);
  }

  const variant = findVariant(product, colorId, sizeId);
  const price = variant?.price ?? product.price;
  const images = imagesForColor(product, colorId);
  const complete = Boolean(variant);

  useEffect(() => {
    track("view_item", {
      currency: product.price.currency,
      value: product.price.amount / 100,
      items: [{ item_id: product.id, item_name: product.name, price: product.price.amount / 100 }],
    });
  }, [product]);

  useEffect(() => {
    const el = disclosureRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        track("delivery_info_viewed", { source: "product", item_id: product.id, configured: isDeliveryConfigured(delivery) });
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [product.id]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-10 lg:gap-16">
        <div className="md:sticky md:top-24 md:self-start">
          <Gallery images={images} variantKey={colorId ?? ""} productName={product.name} />
        </div>

        <div className="md:pt-2">
          {product.status === "demo" && (
            <p className="mb-3 inline-block rounded-[2px] bg-note px-2 py-1 font-mono text-[0.6875rem] tracking-wide text-ink-soft">
              DEMONSTRATION PRODUCT
            </p>
          )}
          <h1 className="display text-[2.75rem] leading-none sm:text-6xl">{product.name}</h1>
          <p className="mt-2 text-sm text-ink-soft">{product.fit.label}</p>
          <p className="mt-4 text-2xl font-semibold tabular-nums" aria-live="polite">
            {formatMoney(price)}
            <span className="sr-only"> {price.currency}</span>
          </p>
          <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-ink-soft">
            {product.tagline}
            {!product.description.verified && (
              <span className="mt-1 block text-xs">Demonstration copy. Product details will be verified before launch.</span>
            )}
          </p>

          <div className="mt-8">
            <AddToBagForm
              product={product}
              colorId={colorId}
              sizeId={sizeId}
              onColorChange={changeColor}
              onSizeChange={setSizeId}
              source="product"
              buttonRef={ctaRef}
              formId={formId}
              optionsId={optionsId}
              disclosure={
                <div ref={disclosureRef} className="scroll-mt-28">
                  <DeliverySummary product={product} id={disclosureId} />
                </div>
              }
            />
          </div>
        </div>
      </div>

      <StickyPurchaseBar
        ctaRef={ctaRef}
        formId={formId}
        optionsId={optionsId}
        disclosureId={disclosureId}
        price={price}
        complete={complete}
        unavailable={Boolean(variant && !variant.available)}
        name={product.name}
      />
      <div className="h-20 md:hidden" aria-hidden="true" />
    </>
  );
}
