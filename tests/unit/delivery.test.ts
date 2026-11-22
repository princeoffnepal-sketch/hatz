import { describe, expect, it } from "vitest";
import { delivery as demoDelivery } from "@/config/delivery";
import { addBusinessDays, estimateDelivery, shippingPriceFor, toIsoDate, totalBusinessDayRange, validateDelivery } from "@/lib/delivery";
import { deliveryCopy } from "@/lib/disclosure";
import { confirmedDelivery } from "./fixtures";

const iso = (d: { year: number; month: number; day: number }) => toIsoDate(d);

describe("delivery configuration validation", () => {
  it("rejects the shipped demo configuration with specific reasons", () => {
    const fields = validateDelivery(demoDelivery).map((i) => i.field);
    expect(fields).toEqual(
      expect.arrayContaining(["status", "productionBusinessDays", "orderCutoffHour", "splitShipment"]),
    );
  });

  it("accepts a complete configuration", () => {
    expect(validateDelivery(confirmedDelivery())).toEqual([]);
  });

  it.each([
    ["inverted production range", { productionBusinessDays: { min: 5, max: 2 } }],
    ["fractional days", { productionBusinessDays: { min: 1.5, max: 3 } }],
    ["bad cutoff", { orderCutoffHour: 24 }],
    ["unknown timezone", { timezone: "Mars/Olympus" }],
    ["no working days", { productionCalendar: { workingDays: [], holidays: [] } }],
    ["no enabled region", { regions: [{ id: "us", label: "US", countries: ["US"], enabled: false }] }],
    ["unconfirmed status", { status: "unconfirmed" as const }],
  ])("rejects %s", (_name, override) => {
    expect(validateDelivery(confirmedDelivery(override)).length).toBeGreaterThan(0);
  });

  it("never produces an estimate or dated copy from an incomplete configuration", () => {
    expect(estimateDelivery(demoDelivery, "standard", new Date())).toBeNull();
    const copy = deliveryCopy(demoDelivery);
    expect(copy.configured).toBe(false);
    expect(copy.production).not.toMatch(/\d/);
    expect(copy.shipping).toContain("3 business days after dispatch");
  });
});

describe("delivery estimates", () => {
  const settings = confirmedDelivery();

  it("counts business days and skips weekends and holidays", () => {
    const cal = { workingDays: [1, 2, 3, 4, 5], holidays: ["2026-11-26"] };
    // Wed Nov 25 + 1 business day skips Thanksgiving (Thu) -> Fri Nov 27
    expect(iso(addBusinessDays({ year: 2026, month: 11, day: 25 }, 1, cal))).toBe("2026-11-27");
    // Fri Nov 27 + 1 -> Mon Nov 30
    expect(iso(addBusinessDays({ year: 2026, month: 11, day: 27 }, 1, cal))).toBe("2026-11-30");
  });

  it("orders before cutoff count from today", () => {
    // Wed Nov 4 2026, 10:00 New York (15:00 UTC)
    const e = estimateDelivery(settings, "standard", new Date("2026-11-04T15:00:00Z"))!;
    expect(iso(e.orderDay)).toBe("2026-11-04");
    expect(iso(e.productionComplete.earliest)).toBe("2026-11-06");
    expect(iso(e.productionComplete.latest)).toBe("2026-11-10");
    expect(iso(e.arrival.earliest)).toBe("2026-11-11");
    expect(iso(e.arrival.latest)).toBe("2026-11-17");
  });

  it("orders after cutoff count from the next business day", () => {
    // Wed Nov 4 2026, 15:00 New York (20:00 UTC), cutoff 14:00
    const e = estimateDelivery(settings, "standard", new Date("2026-11-04T20:00:00Z"))!;
    expect(iso(e.orderDay)).toBe("2026-11-05");
  });

  it("weekend orders count from Monday", () => {
    const e = estimateDelivery(settings, "standard", new Date("2026-11-07T15:00:00Z"))!; // Saturday
    expect(iso(e.orderDay)).toBe("2026-11-09");
  });

  it("applies the cutoff in the facility timezone, not UTC", () => {
    // 01:00 UTC Thursday is still Wednesday 20:00 in New York, after cutoff -> Thursday
    const e = estimateDelivery(settings, "standard", new Date("2026-11-05T01:00:00Z"))!;
    expect(iso(e.orderDay)).toBe("2026-11-05");
  });

  it("never lets arrival precede production completion", () => {
    for (let h = 0; h < 24 * 14; h += 7) {
      const e = estimateDelivery(settings, "standard", new Date(Date.UTC(2026, 10, 1, h)))!;
      expect(iso(e.arrival.earliest) > iso(e.productionComplete.earliest)).toBe(true);
      expect(iso(e.arrival.latest) >= iso(e.arrival.earliest)).toBe(true);
    }
  });

  it("adds acceptance hold, production and transit for the checkout range", () => {
    const s = confirmedDelivery({ acceptanceHoldBusinessDays: 1 });
    expect(totalBusinessDayRange(s, s.services[0])).toEqual({ min: 6, max: 10 });
  });

  it("express services change transit only", () => {
    const s = confirmedDelivery();
    s.services.push({ id: "express", label: "Express", transitBusinessDays: { min: 1, max: 2 }, priceCents: 1500, freeOverCents: null, acceleratesProduction: false });
    const std = estimateDelivery(s, "standard", new Date("2026-11-04T15:00:00Z"))!;
    const exp = estimateDelivery(s, "express", new Date("2026-11-04T15:00:00Z"))!;
    expect(exp.productionComplete).toEqual(std.productionComplete);
    expect(iso(exp.arrival.latest) < iso(std.arrival.latest)).toBe(true);
  });

  it("applies a free-shipping threshold consistently", () => {
    const service = { ...settings.services[0], freeOverCents: 9000 };
    expect(shippingPriceFor(service, 8999)).toBe(595);
    expect(shippingPriceFor(service, 9000)).toBe(0);
  });
});


describe("quantity-based shipping price shared with Stripe", () => {
  it("uses hat quantity even if the subtotal is discounted", () => {
    const service = demoDelivery.services[0];
    expect(shippingPriceFor(service, 100, 2)).toBe(0);
    expect(shippingPriceFor(service, 19500, 3)).toBe(0);
    expect(shippingPriceFor(service, 6500, 1)).toBe(750);
  });
});
