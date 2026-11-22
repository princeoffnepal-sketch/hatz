"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ProductImageData } from "@/lib/types";
import { ProductImage } from "../ProductImage";

const ROLE_NAMES: Record<ProductImageData["role"], string> = {
  front: "Front",
  side: "Side",
  back: "Back",
  worn: "Worn",
  detail: "Detail",
  inside: "Inside",
};

export function Gallery({ images, variantKey, productName }: { images: ProductImageData[]; variantKey: string; productName: string }) {
  const [index, setIndex] = useState(0);
  const [prevKey, setPrevKey] = useState(variantKey);
  const trackRef = useRef<HTMLUListElement>(null);

  // Reset to the first image when the selected color changes.
  if (prevKey !== variantKey) {
    setPrevKey(variantKey);
    setIndex(0);
  }
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
  }, [variantKey]);

  const current = images[Math.min(index, images.length - 1)];
  const hasPlaceholders = images.some((img) => img.kind !== "photo");

  return (
    <div>
      {/* Mobile: swipeable carousel */}
      <div className="relative md:hidden">
        <ul
          ref={trackRef}
          className="scrollbar-none -mx-4 flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${productName} images`}
          onScroll={(e) => {
            const el = e.currentTarget;
            const next = Math.round(el.scrollLeft / el.clientWidth);
            if (next !== index) setIndex(next);
          }}
        >
          {images.map((img, i) => (
            <li key={img.src} className="w-full shrink-0 snap-center" aria-label={`${i + 1} of ${images.length}`}>
              <ProductImage image={img} sizes="100vw" priority={i === 0} aspect="4 / 3" />
            </li>
          ))}
        </ul>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ivory/90 px-2.5 py-1 text-xs font-medium tabular-nums">
          {index + 1} / {images.length}
        </div>
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          {images.map((img, i) => (
            <span
              key={img.src}
              className={`h-1 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-ink" : "w-1.5 bg-line-strong"}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: thumbnails + main image */}
      <div className="hidden gap-4 md:grid md:grid-cols-[4.5rem_1fr] lg:grid-cols-[5.5rem_1fr]">
        <ul className="flex flex-col gap-2" aria-label={`${productName} images`}>
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show ${ROLE_NAMES[img.role].toLowerCase()} image ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`block w-full transition-opacity duration-200 ${i === index ? "opacity-100 ring-1 ring-ink ring-offset-2 ring-offset-ivory" : "opacity-60 hover:opacity-100"}`}
              >
                <ProductImage image={img} sizes="96px" alt="" aspect="4 / 3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="group relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.div
              key={current.src}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductImage image={current} sizes="(min-width: 1280px) 640px, 55vw" priority={index === 0} aspect="4 / 3" />
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      {hasPlaceholders && (
        <p className="mt-3 text-xs text-ink-soft">
          Development placeholders shown. Real photographs of approved samples will replace these before launch.
        </p>
      )}
    </div>
  );
}
