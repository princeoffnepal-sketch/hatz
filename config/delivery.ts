/**
 * Production and delivery settings.
 *
 * Every value here is unconfirmed until your production partner and real test
 * orders support it. While `status` is "unconfirmed" or any required value is
 * null, the storefront shows "to be confirmed" messaging and checkout stays
 * disabled. Do not fill these with guesses.
 *
 * Arrival estimate = order acceptance hold + production business days
 *                    + carrier transit business days.
 */

export type BusinessCalendar = {
  /** 0 = Sunday ... 6 = Saturday */
  workingDays: number[];
  /** ISO dates (YYYY-MM-DD) that are not working days. */
  holidays: string[];
};

export type DayRange = { min: number; max: number };

export type ShippingService = {
  id: string;
  label: string;
  transitBusinessDays: DayRange | null;
  /** Flat per-order price in cents. */
  priceCents: number | null;
  /** Real, consistently applied free-shipping threshold in cents, or null. */
  freeOverCents: number | null;
  /** Quantity threshold counts payable hats, including mixed designs. */
  freeMinQuantity?: number | null;
  /** Express services only change transit. Keep false unless the partner truly expedites production. */
  acceleratesProduction: false;
};

export type ShippingRegion = {
  id: string;
  label: string;
  /** ISO 3166-1 alpha-2 country codes passed to checkout address collection. */
  countries: string[];
  enabled: boolean;
};

export type DeliverySettings = {
  status: "unconfirmed" | "confirmed";
  /** Bump whenever estimates change. It's snapshotted onto each order as the original promise. */
  version: string;
  /** Production facility timezone for the order cutoff. */
  timezone: string;
  /** Orders placed at or after this local hour count from the next business day. */
  orderCutoffHour: number | null;
  /** Review/cancellation hold before submission to production, in business days. */
  acceptanceHoldBusinessDays: number;
  productionBusinessDays: DayRange | null;
  productionCalendar: BusinessCalendar;
  transitCalendar: BusinessCalendar;
  regions: ShippingRegion[];
  services: ShippingService[];
  /** How multi-item orders ship. Null until the partner's behavior is confirmed. */
  splitShipment: null | "ships-together" | "may-ship-separately";
};

export const delivery: DeliverySettings = {
  status: "unconfirmed",
  version: "us-two-hat-free-2026-11-22",
  timezone: "America/New_York",
  orderCutoffHour: null,
  acceptanceHoldBusinessDays: 0,
  productionBusinessDays: null,
  productionCalendar: { workingDays: [1, 2, 3, 4, 5], holidays: [] },
  transitCalendar: { workingDays: [1, 2, 3, 4, 5], holidays: [] },
  regions: [
    {
      id: "us",
      label: "United States",
      countries: ["US"],
      enabled: true,
    },
  ],
  services: [
    {
      id: "standard",
      label: "Standard shipping",
      transitBusinessDays: { min: 3, max: 3 },
      priceCents: 750,
      freeMinQuantity: 2,
      freeOverCents: null,
      acceleratesProduction: false,
    },
  ],
  splitShipment: null,
};
