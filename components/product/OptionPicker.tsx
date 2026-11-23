"use client";

import Link from "next/link";
import { useId } from "react";
import { isColorAvailable, isSizeAvailable } from "@/lib/catalog";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  colorId: string | null;
  sizeId: string | null;
  onColorChange: (id: string) => void;
  onSizeChange: (id: string) => void;
  error?: { field?: string; message: string } | null;
};

/**
 * Color and size controls as native radio groups, so they submit with the
 * form even before JavaScript loads. Every option has a text label;
 * selection is never shown by color alone.
 */
export function OptionPicker({ product, colorId, sizeId, onColorChange, onSizeChange, error }: Props) {
  const uid = useId();
  const selectedColor = product.colors.find((c) => c.id === colorId);
  const colorError = error?.field === "color" ? error.message : null;
  const sizeError = error?.field === "size" ? error.message : null;

  return (
    <div className="space-y-6">
      <fieldset aria-describedby={colorError ? `${uid}-color-error` : undefined}>
        <legend className="mb-3 text-sm">
          <span className="font-semibold">Color</span>
          <span className="text-ink-soft">: {selectedColor?.name ?? "Choose a color"}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((color) => {
            const available = isColorAvailable(product, color.id);
            return (
              <label
                key={color.id}
                className="group/swatch relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3.5 text-sm transition-colors hover:border-ink-soft has-checked:border-ink has-checked:bg-paper has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-green"
              >
                <input
                  type="radio"
                  name="colorId"
                  value={color.id}
                  checked={colorId === color.id}
                  disabled={!available}
                  onChange={() => onColorChange(color.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="relative size-8 rounded-full border border-black/10 transition-transform duration-200 ease-out peer-checked:scale-90 peer-checked:ring-2 peer-checked:ring-ink peer-checked:ring-offset-2 peer-checked:ring-offset-paper"
                  style={{ backgroundColor: color.swatch }}
                />
                <span>
                  {color.name}
                  {!available && <span className="text-ink-soft"> (unavailable)</span>}
                </span>
              </label>
            );
          })}
        </div>
        {colorError && (
          <p id={`${uid}-color-error`} className="mt-2 text-sm font-medium text-alert">
            {colorError}
          </p>
        )}
      </fieldset>

      {product.sizes.length > 0 ? (
        <fieldset aria-describedby={`${uid}-size-help${sizeError ? ` ${uid}-size-error` : ""}`}>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <legend className="text-sm font-semibold">Size</legend>
            <Link
              href={`/fit-guide?from=${product.slug}`}
              className="link text-sm"
            >
              Fit guide
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
            {product.sizes.map((size) => {
              const available = isSizeAvailable(product, colorId, size.id);
              return (
                <label
                  key={size.id}
                  className="relative flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-[2px] border border-line px-3 py-2 text-center text-sm transition-colors hover:border-ink-soft has-checked:border-ink has-checked:bg-ink has-checked:text-ivory has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:text-ink-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-green"
                >
                  <input
                    type="radio"
                    name="sizeId"
                    value={size.id}
                    checked={sizeId === size.id}
                    disabled={!available}
                    onChange={() => onSizeChange(size.id)}
                    className="sr-only"
                  />
                  <span className="font-semibold">{size.name}</span>
                  {!available && <span className="text-xs">Unavailable in {selectedColor?.name ?? "this color"}</span>}
                </label>
              );
            })}
          </div>
          <p id={`${uid}-size-help`} className="mt-2 text-xs text-ink-soft">
            Contact us with your head measurement for sizing help.
          </p>
          {sizeError && (
            <p id={`${uid}-size-error`} className="mt-2 text-sm font-medium text-alert">
              {sizeError}
            </p>
          )}
        </fieldset>
      ) : (
        <div className="text-sm">
          <p>
            <span className="font-semibold">Fit:</span> <span className="text-ink-soft">{product.fit.label}</span>
            {product.fit.adjustable && <span className="text-ink-soft"> · one adjustable size</span>}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {product.fit.measuredRange
              ? `Fits approximately ${product.fit.measuredRange.minCm}–${product.fit.measuredRange.maxCm} cm head circumference.`
              : "Need a specific fit? Contact us with your head measurement."}{" "}
            <Link
              href={`/fit-guide?from=${product.slug}`}
              className="link text-ink"
            >
              Fit guide
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
