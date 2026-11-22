import type { Review } from "@/lib/types";

/**
 * Genuine reviews only, from a real source after confirmed delivery.
 * While this list is empty, review and community sections don't render.
 * Never seed this with sample or invented reviews.
 */
export const reviews: Review[] = [];
