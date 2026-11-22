// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catalog } from "@/data/catalog";
import { registerAnalyticsSink, sanitize, track, trackPurchaseOnce } from "@/lib/analytics";
import { searchEntries, toSearchEntry } from "@/lib/search";

describe("analytics", () => {
  const sink = vi.fn();
  let unregister: () => void;
  beforeEach(() => {
    sink.mockReset();
    localStorage.clear();
    unregister = registerAnalyticsSink(sink);
  });
  afterEach(() => unregister());

  it("strips personal and cost fields from payloads", () => {
    expect(sanitize({ item_id: "a", email: "x@y.z", items: [{ unit_cost: 18, supplierId: "s", price: 45 }] })).toEqual({
      item_id: "a",
      items: [{ price: 45 }],
    });
  });

  it("fires purchase once per transaction ID", () => {
    const payload = { transaction_id: "cs_test_1", currency: "USD", value: 45, items: [] };
    expect(trackPurchaseOnce(payload)).toBe(true);
    expect(trackPurchaseOnce(payload)).toBe(false);
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("refuses purchase events without a transaction ID", () => {
    expect(trackPurchaseOnce({ transaction_id: "", currency: "USD", value: 45, items: [] })).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it("ignores refund events from the browser (owned by the server webhook)", () => {
    track("refund", { transaction_id: "cs_1", currency: "USD", value: 45 });
    expect(sink).not.toHaveBeenCalled();
  });

  it("keeps shopping working when a sink throws", () => {
    const off = registerAnalyticsSink(() => {
      throw new Error("blocked");
    });
    expect(() => track("view_cart", { currency: "USD", value: 0, items: [] })).not.toThrow();
    off();
  });
});

describe("search", () => {
  const entries = catalog.map((p) => toSearchEntry(p, null));
  const ids = (q: string) => searchEntries(entries, q).map((e) => e.id);

  it("matches by accent color, fit, product name and prefix", () => {
    expect(ids("gold").sort()).toEqual(["design-01", "design-02", "design-06"]);
    expect(ids("snapback")).toHaveLength(9);
    expect(ids("angel devil")).toEqual(["design-05"]);
    expect(ids("club")).toContain("design-01");
  });

  it("requires every term to match and returns nothing for blank or unknown queries", () => {
    expect(ids("club gold")).toEqual(["design-01"]);
    expect(ids("   ")).toEqual([]);
    expect(ids("zzzz")).toEqual([]);
  });
});
