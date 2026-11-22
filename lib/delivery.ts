import type { BusinessCalendar, DeliverySettings, ShippingService } from "@/config/delivery";

export type DeliveryIssue = { field: string; message: string };

/** Every reason the delivery configuration can't support a customer-facing promise. */
export function validateDelivery(settings: DeliverySettings): DeliveryIssue[] {
  const issues: DeliveryIssue[] = [];
  const range = (field: string, value: { min: number; max: number } | null, label: string) => {
    if (!value) {
      issues.push({ field, message: `${label} is not set` });
    } else if (
      !Number.isInteger(value.min) ||
      !Number.isInteger(value.max) ||
      value.min < 0 ||
      value.max < value.min
    ) {
      issues.push({ field, message: `${label} must be whole days with min ≤ max` });
    }
  };

  if (settings.status !== "confirmed") {
    issues.push({ field: "status", message: "Delivery settings are not confirmed with the production partner" });
  }
  range("productionBusinessDays", settings.productionBusinessDays, "Production time");
  if (
    settings.orderCutoffHour === null ||
    !Number.isInteger(settings.orderCutoffHour) ||
    settings.orderCutoffHour < 0 ||
    settings.orderCutoffHour > 23
  ) {
    issues.push({ field: "orderCutoffHour", message: "Order cutoff hour (0–23) is not set" });
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone });
  } catch {
    issues.push({ field: "timezone", message: `Unknown timezone "${settings.timezone}"` });
  }
  for (const [name, cal] of [
    ["productionCalendar", settings.productionCalendar],
    ["transitCalendar", settings.transitCalendar],
  ] as const) {
    if (!cal.workingDays.length) issues.push({ field: name, message: "Calendar has no working days" });
  }
  if (!settings.regions.some((r) => r.enabled && r.countries.length)) {
    issues.push({ field: "regions", message: "No shipping destination is enabled" });
  }
  if (!settings.services.length) {
    issues.push({ field: "services", message: "No shipping service is defined" });
  }
  settings.services.forEach((service, i) => {
    range(`services[${i}].transitBusinessDays`, service.transitBusinessDays, `${service.label} transit time`);
    if (service.priceCents === null || !Number.isInteger(service.priceCents) || service.priceCents < 0) {
      issues.push({ field: `services[${i}].priceCents`, message: `${service.label} price is not set` });
    }
  });
  if (!settings.splitShipment) {
    issues.push({ field: "splitShipment", message: "Multi-item shipping behavior is not confirmed" });
  }
  return issues;
}

export function isDeliveryConfigured(settings: DeliverySettings) {
  return validateDelivery(settings).length === 0;
}

/** A calendar date with no time component. Month is 1-based. */
export type CalendarDate = { year: number; month: number; day: number };

export function toIsoDate(d: CalendarDate): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function addDays(d: CalendarDate, days: number): CalendarDate {
  const date = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function weekday(d: CalendarDate) {
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}

export function isBusinessDay(d: CalendarDate, cal: BusinessCalendar) {
  return cal.workingDays.includes(weekday(d)) && !cal.holidays.includes(toIsoDate(d));
}

/** Next business day on or after `d`. */
export function nextBusinessDay(d: CalendarDate, cal: BusinessCalendar): CalendarDate {
  let cursor = d;
  for (let guard = 0; guard < 366; guard++) {
    if (isBusinessDay(cursor, cal)) return cursor;
    cursor = addDays(cursor, 1);
  }
  throw new Error("Calendar has no business days within a year");
}

/** Counts `count` full business days after `start` (start itself is day 0). */
export function addBusinessDays(start: CalendarDate, count: number, cal: BusinessCalendar): CalendarDate {
  let cursor = start;
  let remaining = count;
  for (let guard = 0; remaining > 0; guard++) {
    if (guard > 3660) throw new Error("Calendar has too few business days");
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor, cal)) remaining--;
  }
  return cursor;
}

/** Local date and hour of an instant in a timezone. */
export function zonedParts(instant: Date, timeZone: string): CalendarDate & { hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") };
}

export type DeliveryEstimate = {
  serviceId: string;
  /** First business day the order counts from (after cutoff rules). */
  orderDay: CalendarDate;
  productionComplete: { earliest: CalendarDate; latest: CalendarDate };
  arrival: { earliest: CalendarDate; latest: CalendarDate };
  shippingPriceCents: number;
  configVersion: string;
};

/**
 * Estimated dispatch and arrival range for a service, or null when the
 * configuration can't support a promise. Never returns a guessed date.
 */
export function estimateDelivery(
  settings: DeliverySettings,
  serviceId: string,
  now: Date,
  subtotalCents = 0,
  totalQuantity = 0,
): DeliveryEstimate | null {
  if (!isDeliveryConfigured(settings)) return null;
  const service = settings.services.find((s) => s.id === serviceId);
  if (!service?.transitBusinessDays || service.priceCents === null) return null;
  const production = settings.productionBusinessDays!;
  const cutoff = settings.orderCutoffHour!;

  const local = zonedParts(now, settings.timezone);
  const today: CalendarDate = { year: local.year, month: local.month, day: local.day };
  const prodCal = settings.productionCalendar;
  let orderDay = nextBusinessDay(today, prodCal);
  const sameDay = orderDay.year === today.year && orderDay.month === today.month && orderDay.day === today.day;
  if (sameDay && local.hour >= cutoff) orderDay = nextBusinessDay(addDays(today, 1), prodCal);

  const accepted = addBusinessDays(orderDay, settings.acceptanceHoldBusinessDays, prodCal);
  const productionEarliest = addBusinessDays(accepted, production.min, prodCal);
  const productionLatest = addBusinessDays(accepted, production.max, prodCal);
  const transitCal = settings.transitCalendar;
  const arrivalEarliest = addBusinessDays(
    nextBusinessDay(productionEarliest, transitCal),
    service.transitBusinessDays.min,
    transitCal,
  );
  const arrivalLatest = addBusinessDays(
    nextBusinessDay(productionLatest, transitCal),
    service.transitBusinessDays.max,
    transitCal,
  );

  return {
    serviceId,
    orderDay,
    productionComplete: { earliest: productionEarliest, latest: productionLatest },
    arrival: { earliest: arrivalEarliest, latest: arrivalLatest },
    shippingPriceCents: shippingPriceFor(service, subtotalCents, totalQuantity),
    configVersion: settings.version,
  };
}

/** One authoritative shipping-price rule, applied to the post-discount subtotal. */
export function shippingPriceFor(service: ShippingService, subtotalAfterDiscountsCents: number, totalQuantity = 0): number {
  if (service.freeMinQuantity && totalQuantity >= service.freeMinQuantity) return 0;
  if (service.priceCents === null) throw new Error(`${service.label} has no price`);
  if (service.freeOverCents !== null && subtotalAfterDiscountsCents >= service.freeOverCents) return 0;
  return service.priceCents;
}

/** Total business days from order to latest arrival, for checkout delivery estimates. */
export function totalBusinessDayRange(settings: DeliverySettings, service: ShippingService) {
  if (!settings.productionBusinessDays || !service.transitBusinessDays) return null;
  const hold = settings.acceptanceHoldBusinessDays;
  return {
    min: hold + settings.productionBusinessDays.min + service.transitBusinessDays.min,
    max: hold + settings.productionBusinessDays.max + service.transitBusinessDays.max,
  };
}

export function formatCalendarDate(d: CalendarDate) {
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDayRange(range: { min: number; max: number }, unit = "business days") {
  return range.min === range.max ? `${range.min} ${unit}` : `${range.min}–${range.max} ${unit}`;
}
