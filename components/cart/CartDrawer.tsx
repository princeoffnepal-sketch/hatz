"use client";

import type { ReactNode } from "react";
import { Sheet } from "../ui/Sheet";
import { useCartUi } from "./CartProvider";

/** Accessible cart drawer. Its contents are the server-rendered CartView. */
export function CartDrawer({ children }: { children: ReactNode }) {
  const { drawerOpen, closeDrawer, drawerReturnFocus } = useCartUi();
  return (
    <Sheet open={drawerOpen} onClose={closeDrawer} side="right" title="Your bag" returnFocusRef={drawerReturnFocus}>
      {children}
    </Sheet>
  );
}
