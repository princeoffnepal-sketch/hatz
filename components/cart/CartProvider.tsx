"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type CartUi = {
  drawerOpen: boolean;
  openDrawer: (returnFocusTo?: HTMLElement | null) => void;
  closeDrawer: () => void;
  /** Polite screen-reader announcement (cart changes, errors). */
  announce: (message: string) => void;
  drawerReturnFocus: React.RefObject<HTMLElement | null>;
};

const CartUiContext = createContext<CartUi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const drawerReturnFocus = useRef<HTMLElement | null>(null);

  const announce = useCallback((next: string) => {
    // Clear first so repeating the same message is announced again.
    setMessage("");
    requestAnimationFrame(() => setMessage(next));
  }, []);

  const openDrawer = useCallback((returnFocusTo?: HTMLElement | null) => {
    drawerReturnFocus.current = returnFocusTo ?? null;
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo(
    () => ({ drawerOpen, openDrawer, closeDrawer, announce, drawerReturnFocus }),
    [drawerOpen, openDrawer, closeDrawer, announce],
  );

  return (
    <CartUiContext value={value}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </CartUiContext>
  );
}

export function useCartUi() {
  const ctx = useContext(CartUiContext);
  if (!ctx) throw new Error("useCartUi must be used inside CartProvider");
  return ctx;
}
