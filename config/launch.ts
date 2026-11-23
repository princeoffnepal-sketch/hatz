/**
 * Manual launch sign-offs that can't be derived from code.
 * Record the date and a reference (order number, ticket, photo set) when each
 * step is genuinely complete. See README "Production launch gate".
 */
export const launchSignoffs = {
  /** A real paid order was placed, produced, shipped, delivered and reconciled. */
  testOrderValidated: null as null | { date: string; reference: string },
  /** A refund was issued and reconciled for the test order. */
  refundValidated: null as null | { date: string; reference: string },
};

/** Merchant requested a live launch; orders are fulfilled manually from admin.
 * Unmeasured specifications remain unpublished. No delivered test order is claimed.
 */
export const launchPolicy = { manualFulfillment: true, requireCompleteSpecs: false, requireTestOrder: false };
