import "server-only";

/**
 * PRIVATE OPERATIONAL DATA — server only.
 *
 * `server-only` makes the build fail if a client component imports this file.
 * Never copy operational values from here into product data,
 * analytics events, API responses or Stripe metadata.
 *
 * Acquisition costs are product costs only. Shipping, payment processing,
 * advertising, refunds, taxes and operating costs are additional and unresolved.
 */

export type SupplierRecord = {
  /** Product acquisition cost in cents. */
  unitCostCents: number;
  supplierId: string | null;
  /** Storefront variant ID → approved supplier variant ID. */
  supplierVariantIds: Record<string, string>;
  artworkVersion: string | null;
  sampleApprovedAt: string | null;
};

// Populate approved mappings through private server-side configuration before launch.
export const supplierRecords: Record<string, SupplierRecord> = {};

/** True when every variant of the product maps to an approved supplier variant. */
export function hasApprovedMapping(productId: string, variantIds: string[]): boolean {
  const record = supplierRecords[productId];
  if (!record || !record.supplierId || !record.artworkVersion || !record.sampleApprovedAt) return false;
  return variantIds.every((id) => Boolean(record.supplierVariantIds[id]));
}
