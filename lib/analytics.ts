/**
 * Storefront analytics abstraction. See docs/ANALYTICS.md.
 *
 * Components call `track()` with typed events. Delivery goes to registered
 * sinks only; with none configured, events are dropped (and logged in
 * development). Marketing pixels stay off until a consent-aware sink is added.
 *
 * Event ownership (one owner per event to avoid duplicates):
 *  - Browsing/cart events: this module, from storefront components.
 *  - purchase: the verified order confirmation page (/order/confirmed), once
 *    per Stripe Checkout Session ID. Never on a checkout-button click.
 *  - refund: server-side Stripe webhook (src/app/api/stripe/webhook), not the browser.
 *
 * Never include emails, names, addresses, supplier costs or free-text
 * personalization in event payloads. `sanitize` drops known PII keys.
 */

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
};

export type AnalyticsEventMap = {
  view_item_list: { item_list_id: string; items: AnalyticsItem[] };
  select_item: { item_list_id: string; items: AnalyticsItem[] };
  view_item: { currency: string; value: number; items: AnalyticsItem[] };
  add_to_cart: { currency: string; value: number; items: AnalyticsItem[] };
  remove_from_cart: { currency: string; value: number; items: AnalyticsItem[] };
  view_cart: { currency: string; value: number; items: AnalyticsItem[] };
  begin_checkout: { currency: string; value: number; items: AnalyticsItem[] };
  purchase: { transaction_id: string; currency: string; value: number; shipping?: number; tax?: number; items: AnalyticsItem[] };
  refund: { transaction_id: string; currency: string; value: number };
  fit_guide_opened: { source: string; item_id?: string };
  delivery_info_viewed: { source: string; item_id?: string; configured: boolean };
  variant_selection_error: { item_id: string; field: string };
  add_to_cart_failed: { item_id: string; reason: string };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export type AnalyticsSink = <E extends AnalyticsEventName>(event: E, payload: AnalyticsEventMap[E]) => void;

const sinks: AnalyticsSink[] = [];
const BLOCKED_KEYS = /^(email|e-?mail|name|first_?name|last_?name|phone|address|street|zip|postal|personalization|message|cost|unit_?cost|supplier.*)$/i;

export function registerAnalyticsSink(sink: AnalyticsSink) {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function sanitize<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sanitize) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !BLOCKED_KEYS.test(key))
        .map(([key, v]) => [key, sanitize(v)]),
    ) as T;
  }
  return value;
}

export function track<E extends AnalyticsEventName>(event: E, payload: AnalyticsEventMap[E]) {
  if (event === "refund") {
    // Refunds are owned by the server webhook; ignore browser attempts.
    return;
  }
  const clean = sanitize(payload);
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    console.debug(`[analytics] ${event}`, clean);
  }
  for (const sink of sinks) {
    try {
      sink(event, clean);
    } catch {
      // A failing sink must never break shopping.
    }
  }
}

const PURCHASE_KEY = "tracked-purchases";

/** Fires `purchase` at most once per transaction ID in this browser. */
export function trackPurchaseOnce(payload: AnalyticsEventMap["purchase"]) {
  if (!payload.transaction_id) return false;
  let seen: string[] = [];
  try {
    seen = JSON.parse(localStorage.getItem(PURCHASE_KEY) ?? "[]");
  } catch {
    seen = [];
  }
  if (seen.includes(payload.transaction_id)) return false;
  track("purchase", payload);
  try {
    localStorage.setItem(PURCHASE_KEY, JSON.stringify([...seen, payload.transaction_id].slice(-50)));
  } catch {
    // Storage unavailable: the event still fired once in this page view.
  }
  return true;
}
