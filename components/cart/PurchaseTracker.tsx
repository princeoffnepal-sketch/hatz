"use client";

import { useEffect } from "react";
import { trackPurchaseOnce, type AnalyticsEventMap } from "@/lib/analytics";

/** Fires `purchase` once per verified Stripe session (deduplicated by transaction ID). */
export function PurchaseTracker({ payload }: { payload: AnalyticsEventMap["purchase"] }) {
  useEffect(() => {
    trackPurchaseOnce(payload);
  }, [payload]);
  return null;
}
