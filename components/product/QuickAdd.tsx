"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { defaultColorId, primaryImage } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { DeliverySummary } from "../DeliverySummary";
import { ProductImage } from "../ProductImage";
import { Sheet } from "../ui/Sheet";
import { Icon } from "../ui/Icon";
import { AddToBagForm } from "./AddToBagForm";

/**
 * Quick add always opens a compact chooser: it never picks a size for the
 * customer and always shows the made-to-order disclosure before adding.
 */
export function QuickAdd({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [colorId, setColorId] = useState<string | null>(() => defaultColorId(product));
  const [sizeId, setSizeId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        aria-haspopup="dialog"
      >
        <Icon name="plus" size={16} />
        Quick add<span className="sr-only"> {product.name}</span>
      </button>
      <Sheet open={open} onClose={close} side="center" title={`Quick add: ${product.name}`} hideTitle returnFocusRef={triggerRef}>
        {mounted && (
          <div className="grid gap-5 p-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
            <div className="w-28 sm:w-auto">
              <ProductImage image={primaryImage(product, colorId)} sizes="144px" aspect="4 / 5" showKindBadge />
            </div>
            <div>
              <p className="display text-3xl">{product.name}</p>
              <p className="mt-1 text-sm text-ink-soft">{product.fit.label}</p>
              <p className="mt-2 text-lg font-semibold">{formatMoney(product.price)}</p>
              <div className="mt-5">
                <AddToBagForm
                  product={product}
                  colorId={colorId}
                  sizeId={sizeId}
                  onColorChange={setColorId}
                  onSizeChange={setSizeId}
                  source="quick_add"
                  onAdded={close}
                  returnFocusRef={triggerRef}
                  disclosure={<DeliverySummary product={product} compact />}
                />
              </div>
              <Link href={`/products/${product.slug}${colorId ? `?color=${colorId}` : ""}`} className="link-arrow mt-5 text-sm">
                View full details
              </Link>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
