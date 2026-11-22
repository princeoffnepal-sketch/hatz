"use client";

import { AnimatePresence, m } from "motion/react";
import { useActionState, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { addToCartAction, type AddToCartState } from "@/lib/cart/actions";
import { findVariant } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { useCartUi } from "../cart/CartProvider";
import { Icon } from "../ui/Icon";
import { OptionPicker } from "./OptionPicker";

type Props = {
  product: Product;
  colorId: string | null;
  sizeId: string | null;
  onColorChange: (id: string) => void;
  onSizeChange: (id: string) => void;
  /** Rendered between the options and the button (made-to-order disclosure). */
  disclosure: ReactNode;
  source: string;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  /** Called after a successful add, before the cart drawer opens. */
  onAdded?: () => void;
  /** Element that should regain focus when the cart drawer closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  formId?: string;
  optionsId?: string;
};

const initial: AddToCartState = { status: "idle" };

export function AddToBagForm({
  product,
  colorId,
  sizeId,
  onColorChange,
  onSizeChange,
  disclosure,
  source,
  buttonRef,
  onAdded,
  returnFocusRef,
  formId,
  optionsId,
}: Props) {
  const [state, formAction, pending] = useActionState(addToCartAction, initial);
  const [localError, setLocalError] = useState<{ field: string; message: string } | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const { announce, openDrawer } = useCartUi();
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<number | null>(null);

  const variant = findVariant(product, colorId, sizeId);
  const unavailable = variant ? !variant.available : false;
  const price = variant?.price ?? product.price;

  useEffect(() => {
    if (state.status === "idle" || handled.current === state.at) return;
    handled.current = state.at;
    announce(state.message);
    if (state.status === "success") {
      track("add_to_cart", {
        currency: state.item.currency,
        value: state.item.price * state.item.quantity,
        items: [state.item],
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJustAdded(true);
      const timer = setTimeout(() => setJustAdded(false), 1800);
      onAdded?.();
      openDrawer(returnFocusRef?.current ?? buttonRef?.current ?? null);
      return () => clearTimeout(timer);
    }
    track("add_to_cart_failed", { item_id: product.id, reason: state.field ?? "server" });
  }, [state, announce, openDrawer, onAdded, product.id, buttonRef, returnFocusRef]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const missing = !colorId ? "color" : product.sizes.length && !sizeId ? "size" : null;
    if (missing) {
      event.preventDefault();
      const message = missing === "color" ? "Choose a color." : "Choose a size.";
      setLocalError({ field: missing, message });
      announce(message);
      track("variant_selection_error", { item_id: product.id, field: missing });
      formRef.current?.querySelector<HTMLInputElement>(`input[name="${missing}Id"]:not(:disabled)`)?.focus();
      return;
    }
    setLocalError(null);
  }

  const error = localError ?? (state.status === "error" ? state : null);
  const serverErrorWithoutField = state.status === "error" && !state.field && !localError ? state.message : null;

  return (
    <form id={formId} ref={formRef} action={formAction} onSubmit={handleSubmit} noValidate className="space-y-6">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="quantity" value="1" />
      <div id={optionsId} className="scroll-mt-28">
      <OptionPicker
        product={product}
        colorId={colorId}
        sizeId={sizeId}
        onColorChange={(id) => {
          setLocalError(null);
          onColorChange(id);
        }}
        onSizeChange={(id) => {
          setLocalError(null);
          onSizeChange(id);
        }}
        error={error}
      />
      </div>

      {disclosure}

      <div>
        <button
          ref={buttonRef}
          type="submit"
          className="btn btn-primary relative w-full overflow-hidden text-base"
          disabled={pending || unavailable}
          aria-busy={pending}
          aria-describedby={serverErrorWithoutField ? `${product.id}-${source}-error` : undefined}
        >
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={justAdded ? "added" : pending ? "pending" : "idle"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="inline-flex items-center gap-2"
            >
              {justAdded ? (
                <>
                  <Icon name="check" size={18} /> Added to bag
                </>
              ) : pending ? (
                "Adding…"
              ) : unavailable ? (
                "Temporarily unavailable"
              ) : (
                <>
                  Add to bag <span aria-hidden="true">·</span> {formatMoney(price)}
                </>
              )}
            </m.span>
          </AnimatePresence>
        </button>
        {serverErrorWithoutField && (
          <p id={`${product.id}-${source}-error`} role="alert" className="mt-2 text-sm font-medium text-alert">
            {serverErrorWithoutField}
          </p>
        )}
        {unavailable && variant?.availabilityNote && (
          <p className="mt-2 text-sm text-ink-soft">{variant.availabilityNote}. Choose another option.</p>
        )}
        {state.status === "success" && (
          <noscript>
            <p className="mt-2 text-sm">
              Added. <a href="/cart" className="link">View your bag</a>
            </p>
          </noscript>
        )}
      </div>
    </form>
  );
}
