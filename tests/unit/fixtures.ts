import type { DeliverySettings } from "@/config/delivery";

/** A complete, valid delivery configuration used only in tests. Not real business data. */
export function confirmedDelivery(overrides: Partial<DeliverySettings> = {}): DeliverySettings {
  return {
    status: "confirmed",
    version: "test-1",
    timezone: "America/New_York",
    orderCutoffHour: 14,
    acceptanceHoldBusinessDays: 0,
    productionBusinessDays: { min: 2, max: 4 },
    productionCalendar: { workingDays: [1, 2, 3, 4, 5], holidays: [] },
    transitCalendar: { workingDays: [1, 2, 3, 4, 5], holidays: [] },
    regions: [{ id: "us", label: "Contiguous United States", countries: ["US"], enabled: true }],
    services: [
      { id: "standard", label: "Standard shipping", transitBusinessDays: { min: 3, max: 5 }, priceCents: 595, freeOverCents: null, acceleratesProduction: false },
    ],
    splitShipment: "ships-together",
    ...overrides,
  };
}
