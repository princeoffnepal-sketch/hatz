import "server-only";
import { getCommerceConfig } from "@/config/commerce.server";
import { delivery } from "@/config/delivery";
import { launchSignoffs } from "@/config/launch";
import { policies } from "@/config/policies";
import { site } from "@/config/site";
import { hasApprovedMapping } from "@/data/private/supplier.server";
import { getProducts } from "@/lib/catalog.server";
import { evaluateGate } from "./gate";

export function getGate() {
  const config = getCommerceConfig();
  return evaluateGate({
    mode: config.mode,
    stripeKeyKind: config.stripe.keyKind,
    webhookSecretSet: Boolean(config.stripe.webhookSecret),
    siteUrl: config.siteUrl,
    products: getProducts(),
    delivery,
    policies: Object.values(policies),
    supportEmail: site.support.email,
    businessLegalName: site.business.legalName,
    hasApprovedMapping: (p) => hasApprovedMapping(p.id, p.variants.map((v) => v.id)),
    testOrderValidated: Boolean(launchSignoffs.testOrderValidated),
  });
}

/** Public, non-sensitive summary for client components. */
export function getCheckoutAvailability() {
  const gate = getGate();
  return {
    mode: gate.mode,
    enabled: gate.checkoutEnabled,
    /** Short reasons only; no secrets or private data. */
    blockers: gate.checks.filter((c) => c.required && !c.ok).map((c) => c.label),
  };
}

export type CheckoutAvailability = ReturnType<typeof getCheckoutAvailability>;
