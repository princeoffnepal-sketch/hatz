import { describe, expect, it } from "vitest";
import { delivery as demoDelivery } from "@/config/delivery";
import { catalog } from "@/data/catalog";
import {
  addLine,
  buildCart,
  cartHasBlockingLines,
  CartError,
  MAX_LINE_QUANTITY,
  MAX_LINES,
  parseStoredCart,
  removeLine,
  serializeStoredCart,
  setLineQuantity,
} from "@/lib/cart/core";
import { formatMoney } from "@/lib/money";
import { confirmedDelivery } from "./fixtures";

const vFirst = "design-01-as-shown"; // $55
const vSecond = "design-04-as-shown"; // $50
const unavailable = "test-unavailable";

describe("cart arithmetic", () => {
  it("computes line totals and subtotal in integer cents", () => {
    const lines = addLine(addLine([], vFirst, 2), vSecond, 1);
    const cart = buildCart(lines, catalog, demoDelivery);
    expect(cart.lines.map((l) => l.lineTotal.amount)).toEqual([11000, 5000]);
    expect(cart.subtotal.amount).toBe(16000);
    expect(cart.totalQuantity).toBe(3);
    expect(formatMoney(cart.subtotal)).toBe("$160");
  });

  it("merges repeated adds of the same variant and clamps to the per-line maximum", () => {
    let lines = addLine([], vFirst, 1);
    lines = addLine(lines, vFirst, 1);
    expect(lines).toEqual([{ v: vFirst, q: 2 }]);
    lines = addLine(lines, vFirst, 50);
    expect(lines[0].q).toBe(MAX_LINE_QUANTITY);
  });

  it("updates, decrements to zero (removes) and removes lines", () => {
    let lines = addLine([], vFirst, 3);
    lines = setLineQuantity(lines, vFirst, 1);
    expect(lines[0].q).toBe(1);
    expect(setLineQuantity(lines, vFirst, 0)).toEqual([]);
    expect(removeLine(addLine(lines, vSecond, 1), vFirst)).toEqual([{ v: vSecond, q: 1 }]);
  });

  it("rejects adding beyond the maximum number of lines", () => {
    const full = Array.from({ length: MAX_LINES }, (_, i) => ({ v: `x-${i}`, q: 1 }));
    expect(() => addLine(full, vFirst, 1)).toThrow(CartError);
  });
});

describe("variant / cart consistency", () => {
  it("derives names, color, size, price and image from the catalog, not from storage", () => {
    const cart = buildCart([{ v: "design-05-as-shown", q: 1 }], catalog, demoDelivery);
    const line = cart.lines[0];
    expect(line).toMatchObject({ name: "Angel & Devil", colorName: "Black / silver-tone / red", sizeName: null, unitPrice: { amount: 5000 } });
    expect(line.image?.src).toBe("/products/angel-and-devil/01-front.png");
  });

  it("drops variants that no longer exist and reports them", () => {
    const cart = buildCart([{ v: "design-99-gone", q: 1 }, { v: vFirst, q: 1 }], catalog, demoDelivery);
    expect(cart.lines).toHaveLength(1);
    expect(cart.removedLines).toEqual([{ variantId: "design-99-gone", reason: expect.any(String) }]);
  });

  it("keeps unavailable variants visible but excludes them from totals and blocks checkout", () => {
    const cart = buildCart([{ v: unavailable, q: 2 }, { v: vFirst, q: 1 }], [...catalog, { ...catalog[1], variants: [{ ...catalog[1].variants[0], id: unavailable, available: false }] }], demoDelivery);
    expect(cart.lines).toHaveLength(2);
    expect(cart.subtotal.amount).toBe(5500);
    expect(cart.totalQuantity).toBe(1);
    expect(cartHasBlockingLines(cart)).toBe(true);
  });
});

describe("cart persistence format", () => {
  it("round-trips through serialization", () => {
    const lines = addLine(addLine([], vFirst, 2), vSecond, 1);
    expect(parseStoredCart(serializeStoredCart(lines))).toEqual(lines);
  });

  it("stores only variant IDs and quantities (no prices)", () => {
    const raw = serializeStoredCart([{ v: vFirst, q: 1, price: 1 } as never]);
    expect(JSON.parse(raw)).toEqual([{ v: vFirst, q: 1 }]);
  });

  it("ignores tampered price fields and recomputes from the catalog", () => {
    const tampered = JSON.stringify([{ v: vSecond, q: 1, unitPrice: 1, price: 0 }]);
    const cart = buildCart(parseStoredCart(tampered), catalog, demoDelivery);
    expect(cart.subtotal.amount).toBe(5000);
  });

  it.each([undefined, "", "not json", "{}", '[{"v":1,"q":1}]', '[{"v":"a","q":0}]', '[{"v":"a","q":-3}]'])(
    "treats malformed stored value %j as empty or filters bad entries",
    (raw) => {
      expect(parseStoredCart(raw)).toEqual([]);
    },
  );

  it("merges duplicate entries and clamps quantities from storage", () => {
    expect(parseStoredCart(JSON.stringify([{ v: vFirst, q: 7 }, { v: vFirst, q: 7 }]))).toEqual([{ v: vFirst, q: MAX_LINE_QUANTITY }]);
  });
});

describe("shipping quote", () => {
  it("charges $7.50 for one hat", () => {
    const cart = buildCart([{ v: vFirst, q: 1 }], catalog, demoDelivery);
    expect(cart.shipping).toMatchObject({ status: "at-checkout", amount: { amount: 750 } });
  });

  it("applies one shipping rule to the post-discount subtotal when configured", () => {
    const settings = confirmedDelivery();
    settings.services[0].freeOverCents = 10000;
    const under = buildCart([{ v: vFirst, q: 1 }], catalog, settings);
    const over = buildCart([{ v: vSecond, q: 2 }], catalog, settings);
    expect(under.shipping).toMatchObject({ status: "at-checkout", amount: { amount: 595 } });
    expect(over.shipping).toMatchObject({ status: "at-checkout", amount: { amount: 0 } });
  });
});


describe("two-hat free shipping", () => {
  it.each([
    [[{ v: vFirst, q: 2 }]],
    [[{ v: vFirst, q: 1 }, { v: vSecond, q: 1 }]],
    [[{ v: vFirst, q: 3 }]],
  ])("is free for same or mixed designs: %j", (lines) => {
    const cart = buildCart(lines, catalog, demoDelivery);
    expect(cart.shipping).toMatchObject({ status: "at-checkout", amount: { amount: 0 } });
  });
  it("restores $7.50 shipping when quantity drops below two", () => {
    const lines = setLineQuantity([{ v: vFirst, q: 2 }], vFirst, 1);
    expect(buildCart(lines, catalog, demoDelivery).shipping).toMatchObject({ amount: { amount: 750 } });
  });
  it("does not count unavailable hats toward free shipping", () => {
    const products = [{ ...catalog[0], variants: [{ ...catalog[0].variants[0], available: false }] }, catalog[3]];
    expect(buildCart([{ v: vFirst, q: 2 }, { v: vSecond, q: 1 }], products, demoDelivery).shipping).toMatchObject({ amount: { amount: 750 } });
  });
});
