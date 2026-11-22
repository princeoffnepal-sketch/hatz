import "server-only";
import { runtime } from "@/lib/admin/db.server";

/**
 * Commerce integration settings, read from server-side environment variables.
 * Nothing here is sent to the browser. See `.env.example`.
 *
 * STORE_MODE
 *   demo        – default. Demo catalog, checkout preview only, no payment collection.
 *   stripe-test – Stripe test-mode Checkout for launch validation. Requires sk_test_ key
 *                 and a confirmed delivery configuration.
 *   live        – real sales. Requires every launch-gate check to pass.
 */

export type StoreMode = "demo" | "stripe-test" | "live";

function readMode(): StoreMode {
  const value = runtime("STORE_MODE");
  if (value === "stripe-test" || value === "live") return value;
  return "demo";
}

export function getCommerceConfig() {
  const mode = readMode();
  const secretKey = runtime("STRIPE_SECRET_KEY") ?? null;
  return {
    mode,
    stripe: {
      secretKey,
      webhookSecret: runtime("STRIPE_WEBHOOK_SECRET") ?? null,
      keyKind: secretKey?.startsWith("sk_live_")
        ? ("live" as const)
        : secretKey?.startsWith("sk_test_")
          ? ("test" as const)
          : null,
      /** Only enable after Stripe Tax registrations are configured in the Dashboard. */
      automaticTax: runtime("STRIPE_AUTOMATIC_TAX") === "true",
    },
    siteUrl: runtime("NEXT_PUBLIC_SITE_URL") || null,
  };
}

export type CommerceConfig = ReturnType<typeof getCommerceConfig>;
