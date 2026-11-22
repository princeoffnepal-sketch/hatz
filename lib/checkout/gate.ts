import type { DeliverySettings } from "@/config/delivery";
import type { PolicyRef } from "@/config/policies";
import { productLaunchIssues, validateProduct } from "@/lib/catalog";
import { validateDelivery } from "@/lib/delivery";
import type { Product } from "@/lib/types";

export type GateMode = "demo" | "stripe-test" | "live";

export type GateCheck = {
  id: string;
  label: string;
  ok: boolean;
  details: string[];
  /** Checks that apply in this mode. Others are shown as informational. */
  required: boolean;
};

export type GateInput = {
  mode: GateMode;
  stripeKeyKind: "live" | "test" | null;
  webhookSecretSet: boolean;
  siteUrl: string | null;
  products: Product[];
  delivery: DeliverySettings;
  policies: PolicyRef[];
  supportEmail: string | null;
  businessLegalName: string | null;
  hasApprovedMapping: (product: Product) => boolean;
  testOrderValidated: boolean;
};

export type GateResult = {
  mode: GateMode;
  checkoutEnabled: boolean;
  checks: GateCheck[];
};

/**
 * Decides whether real checkout may run. Demo mode never collects payment.
 * stripe-test needs enough to place a realistic test-mode order; live needs
 * every business input to be real and verified.
 */
export function evaluateGate(input: GateInput): GateResult {
  const live = input.mode === "live";
  const test = input.mode === "stripe-test";
  const checks: GateCheck[] = [];
  const add = (id: string, label: string, details: string[], required: boolean) =>
    checks.push({ id, label, ok: details.length === 0, details, required });

  add(
    "mode",
    "Store mode allows payments",
    input.mode === "demo" ? ["STORE_MODE is demo. Checkout is a preview and no payment is collected."] : [],
    true,
  );

  const keyIssues: string[] = [];
  if (!input.stripeKeyKind) keyIssues.push("STRIPE_SECRET_KEY is not set");
  else if (live && input.stripeKeyKind !== "live") keyIssues.push("Live mode requires a live secret key (sk_live_)");
  else if (test && input.stripeKeyKind !== "test") keyIssues.push("stripe-test mode requires a test secret key (sk_test_)");
  add("stripe", "Stripe Checkout connected", keyIssues, live || test);

  add(
    "webhook",
    "Stripe webhook signing secret set",
    input.webhookSecretSet ? [] : ["STRIPE_WEBHOOK_SECRET is not set; paid orders can't be received reliably"],
    live,
  );

  add(
    "site-url",
    "Public site URL configured",
    input.siteUrl && /^https?:\/\//.test(input.siteUrl) ? [] : ["NEXT_PUBLIC_SITE_URL is not set"],
    live || test,
  );

  add(
    "delivery",
    "Production, delivery and shipping prices confirmed",
    validateDelivery(input.delivery).map((i) => i.message),
    live || test,
  );

  add(
    "catalog",
    "Catalog has sellable products with valid data",
    [
      ...(input.products.length ? [] : ["No products are visible in this mode"]),
      ...input.products.flatMap(validateProduct),
    ],
    live || test,
  );

  add(
    "product-content",
    "Real approved photos and verified specifications",
    input.products.flatMap(productLaunchIssues),
    live,
  );

  add(
    "supplier",
    "Approved supplier mappings for every variant",
    input.products.filter((p) => !input.hasApprovedMapping(p)).map((p) => `${p.name}: no approved supplier mapping`),
    live,
  );

  add(
    "policies",
    "Final return, shipping, privacy and terms policies",
    input.policies.filter((p) => p.status !== "final").map((p) => `${p.title} is still a draft`),
    live,
  );

  add(
    "support",
    "Working support contact and business identity",
    [
      ...(input.supportEmail ? [] : ["Support email is not set in src/config/site.ts"]),
      ...(input.businessLegalName ? [] : ["Business legal name is not set in src/config/site.ts"]),
    ],
    live,
  );

  add(
    "test-order",
    "Successful test order and fulfillment validated",
    input.testOrderValidated ? [] : ["No validated end-to-end test order recorded in src/config/launch.ts"],
    live,
  );

  const checkoutEnabled = input.mode !== "demo" && checks.every((c) => !c.required || c.ok);
  return { mode: input.mode, checkoutEnabled, checks };
}
