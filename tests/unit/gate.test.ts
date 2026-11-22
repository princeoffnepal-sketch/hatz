import { describe, expect, it } from "vitest";
import { delivery as demoDelivery } from "@/config/delivery";
import { policies } from "@/config/policies";
import { catalog } from "@/data/catalog";
import { evaluateGate, type GateInput } from "@/lib/checkout/gate";
import type { Product } from "@/lib/types";
import { confirmedDelivery } from "./fixtures";

const publishedProduct: Product = {
  ...catalog[0],
  status: "published",
  description: { text: "Verified.", verified: true },
  fit: { ...catalog[0].fit, verified: true, measuredRange: { minCm: 55, maxCm: 60 } },
  construction: { material: "Verified material", panelCount: 6, decoration: "Embroidery", care: "Spot clean", verified: true },
  images: catalog[0].images.map((img) => ({ ...img, kind: "photo" as const, approved: true })),
};

function input(overrides: Partial<GateInput> = {}): GateInput {
  return {
    mode: "demo",
    stripeKeyKind: null,
    webhookSecretSet: false,
    siteUrl: null,
    products: catalog,
    delivery: demoDelivery,
    policies: Object.values(policies),
    supportEmail: null,
    businessLegalName: null,
    hasApprovedMapping: () => false,
    testOrderValidated: false,
    ...overrides,
  };
}

const ready: Partial<GateInput> = {
  stripeKeyKind: "live",
  webhookSecretSet: true,
  siteUrl: "https://example.com",
  products: [publishedProduct],
  delivery: confirmedDelivery(),
  policies: Object.values(policies).map((p) => ({ ...p, status: "final" as const, effectiveDate: "2026-12-01" })),
  supportEmail: "help@example.com",
  businessLegalName: "Example LLC",
  hasApprovedMapping: () => true,
  testOrderValidated: true,
};

describe("checkout gate", () => {
  it("never enables checkout in demo mode, even with everything configured", () => {
    expect(evaluateGate(input()).checkoutEnabled).toBe(false);
    expect(evaluateGate(input({ ...ready, mode: "demo" })).checkoutEnabled).toBe(false);
  });

  it("enables live checkout only when every launch check passes", () => {
    expect(evaluateGate(input({ ...ready, mode: "live" })).checkoutEnabled).toBe(true);
  });

  it.each<[string, Partial<GateInput>]>([
    ["placeholder products", { products: catalog }],
    ["draft policies", { policies: Object.values(policies) }],
    ["unconfirmed delivery", { delivery: demoDelivery }],
    ["missing supplier mapping", { hasApprovedMapping: () => false }],
    ["no support email", { supportEmail: null }],
    ["no test order", { testOrderValidated: false }],
    ["test key in live mode", { stripeKeyKind: "test" }],
    ["no webhook secret", { webhookSecretSet: false }],
    ["no site url", { siteUrl: null }],
  ])("blocks live checkout with %s", (_name, override) => {
    const result = evaluateGate(input({ ...ready, ...override, mode: "live" }));
    expect(result.checkoutEnabled).toBe(false);
    expect(result.checks.some((c) => c.required && !c.ok)).toBe(true);
  });

  it("allows stripe-test with a test key and confirmed delivery for launch validation", () => {
    const result = evaluateGate(
      input({ mode: "stripe-test", stripeKeyKind: "test", siteUrl: "http://localhost:3000", delivery: confirmedDelivery() }),
    );
    expect(result.checkoutEnabled).toBe(true);
  });

  it("blocks stripe-test when delivery is unconfirmed or a live key is used", () => {
    expect(evaluateGate(input({ mode: "stripe-test", stripeKeyKind: "test", siteUrl: "http://x.test" })).checkoutEnabled).toBe(false);
    expect(
      evaluateGate(input({ mode: "stripe-test", stripeKeyKind: "live", siteUrl: "http://x.test", delivery: confirmedDelivery() })).checkoutEnabled,
    ).toBe(false);
  });
});
