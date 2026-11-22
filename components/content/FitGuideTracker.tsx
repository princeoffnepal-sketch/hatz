"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Single owner of fit_guide_opened. Records which product (if any) the visitor came from. */
export function FitGuideTracker() {
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    track("fit_guide_opened", from ? { source: "product", item_id: from } : { source: "navigation" });
  }, []);
  return null;
}
