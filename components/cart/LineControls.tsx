"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateLineAction, type LineUpdateState } from "@/lib/cart/actions";
import { MAX_LINE_QUANTITY } from "@/lib/cart/core";
import { track } from "@/lib/analytics";
import type { CartLine } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { useCartUi } from "./CartProvider";

/**
 * Quantity stepper and remove button. Plain forms posting to a Server Action,
 * so they also work on the full cart page before JavaScript loads.
 */
export function LineControls({ line }: { line: CartLine }) {
  const [state, action, pending] = useActionState<LineUpdateState, FormData>(updateLineAction, null);
  const { announce } = useCartUi();
  const handled = useRef<number | null>(null);
  const label = [line.name, line.colorName, line.sizeName].filter(Boolean).join(", ");

  useEffect(() => {
    if (!state || handled.current === state.at) return;
    handled.current = state.at;
    announce(state.message);
  }, [state, announce]);

  return (
    <div className="flex items-center justify-between gap-3" aria-busy={pending}>
      {line.available ? (
        <form action={action} className="flex items-center rounded-[2px] border border-line">
          <input type="hidden" name="variantId" value={line.variantId} />
          <button
            type="submit"
            name="intent"
            value="decrement"
            disabled={pending}
            className="inline-flex size-11 items-center justify-center transition-colors hover:bg-ivory-deep disabled:opacity-50"
            aria-label={line.quantity === 1 ? `Remove ${label}` : `Decrease quantity of ${label}`}
            onClick={() => {
              if (line.quantity === 1) {
                track("remove_from_cart", {
                  currency: line.unitPrice.currency,
                  value: line.unitPrice.amount / 100,
                  items: [{ item_id: line.productId, item_name: line.name, item_variant: line.variantId, quantity: 1 }],
                });
              }
            }}
          >
            <Icon name="minus" size={16} />
          </button>
          <output className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-label={`Quantity of ${label}`}>
            {line.quantity}
          </output>
          <button
            type="submit"
            name="intent"
            value="increment"
            disabled={pending || line.quantity >= MAX_LINE_QUANTITY}
            className="inline-flex size-11 items-center justify-center transition-colors hover:bg-ivory-deep disabled:opacity-40"
            aria-label={`Increase quantity of ${label}`}
          >
            <Icon name="plus" size={16} />
          </button>
        </form>
      ) : (
        <span className="text-sm font-medium text-alert">No longer available</span>
      )}
      <form action={action}>
        <input type="hidden" name="variantId" value={line.variantId} />
        <button
          type="submit"
          name="intent"
          value="remove"
          disabled={pending}
          className="min-h-11 text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50"
          onClick={() =>
            track("remove_from_cart", {
              currency: line.unitPrice.currency,
              value: line.lineTotal.amount / 100,
              items: [{ item_id: line.productId, item_name: line.name, item_variant: line.variantId, quantity: line.quantity }],
            })
          }
        >
          Remove<span className="sr-only"> {label}</span>
        </button>
      </form>
    </div>
  );
}
