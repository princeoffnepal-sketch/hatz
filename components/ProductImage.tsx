"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImageData } from "@/lib/types";

const FALLBACK = "/images/missing.svg";

type Props = {
  image: ProductImageData | null | undefined;
  /** CSS aspect ratio for the frame, e.g. "4 / 5". Reserves space to avoid layout shift. */
  aspect?: string;
  sizes: string;
  /** Load eagerly with high priority (first visible product or hero image). */
  priority?: boolean;
  className?: string;
  /** Show a "Preview render" badge on supplier mockups (placeholders are self-labeled). */
  showKindBadge?: boolean;
  /** Override alt text (e.g. "" when the image is decorative next to a text link). */
  alt?: string;
};

/**
 * Every product image renders through this component. It reads src, alt,
 * dimensions and object position from catalog data, so replacing image paths
 * in src/data/catalog.ts updates cards, galleries, cart thumbnails and related
 * products with no component changes.
 */
export function ProductImage({ image, aspect = "4 / 3", sizes, priority, className = "", showKindBadge, alt }: Props) {
  const [failed, setFailed] = useState(false);
  const src = !image || failed ? FALLBACK : image.src;
  const altText = alt ?? (image && !failed ? image.alt : "Image unavailable");
  // Generated placeholders label themselves inside the image; supplier mockups don't, so they get a badge.
  const kindLabel = image?.kind === "mockup" ? "Preview render" : null;

  return (
    <div className={`frame zoom-on-hover ${className}`} style={{ aspectRatio: aspect }}>
      <Image
        src={src}
        alt={altText}
        fill
        sizes={sizes}
        preload={priority}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        onError={() => setFailed(true)}
        className="object-contain"
        style={{ objectPosition: image?.objectPosition ?? "50% 50%" }}
      />
      {showKindBadge && kindLabel && !failed && (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-[2px] bg-ivory/90 px-1.5 py-0.5 font-mono text-[0.625rem] tracking-wide text-ink-soft">
          {kindLabel}
        </span>
      )}
    </div>
  );
}
