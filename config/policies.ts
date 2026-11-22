/**
 * Policy references and their publication state.
 *
 * "draft" policies render with a visible draft banner and block live checkout.
 * Replace the draft text in each policy page with reviewed policy text from
 * the business owner, then set the status to "final" with an effective date.
 */

export type PolicyStatus = "draft" | "final";

export type PolicyRef = {
  id: string;
  title: string;
  href: string;
  status: PolicyStatus;
  effectiveDate: string | null;
  /** One-line summary shown near the buy button and in the cart. */
  summary: string;
};

export const policies = {
  returns: {
    id: "returns-owner-2026-11",
    title: "Returns & cancellations",
    href: "/returns",
    status: "final",
    effectiveDate: "2026-11-22",
    summary:
      "Cancel before shipment. 14-day returns on eligible unused hats. See full terms for damaged-item replacements and return shipping.",
  },
  shipping: {
    id: "shipping-draft",
    title: "Shipping & delivery",
    href: "/shipping",
    status: "draft",
    effectiveDate: null,
    summary: "U.S. shipping: $7.50 for one hat, free with 2+ hats. Estimated 3 business days after dispatch; production time is additional.",
  },
  privacy: {
    id: "privacy-draft",
    title: "Privacy policy",
    href: "/privacy",
    status: "draft",
    effectiveDate: null,
    summary: "Draft privacy policy.",
  },
  terms: {
    id: "terms-draft",
    title: "Terms of service",
    href: "/terms",
    status: "draft",
    effectiveDate: null,
    summary: "Draft terms of service.",
  },
} satisfies Record<string, PolicyRef>;

export type PolicyKey = keyof typeof policies;
