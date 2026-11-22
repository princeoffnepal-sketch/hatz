/**
 * Public catalog types. Everything in these shapes may be sent to the browser.
 * Private operational data (supplier costs, supplier variant IDs) lives in
 * `src/data/private/*.server.ts` and must never be added here.
 */

export type CurrencyCode = "USD";

/** Money is stored in minor units (cents) to avoid floating-point drift. */
export type Money = {
  amount: number;
  currency: CurrencyCode;
};

export type ImageRole = "front" | "side" | "back" | "worn" | "detail" | "inside";

/**
 * placeholder: generated development preview, never a real product depiction.
 * mockup: supplier-generated render; must be disclosed as a preview.
 * photo: photograph of an approved physical sample.
 */
export type ImageKind = "placeholder" | "mockup" | "photo";

export type ProductImageData = {
  src: string;
  alt: string;
  role: ImageRole;
  kind: ImageKind;
  width: number;
  height: number;
  /** Limits the image to one color. Omit for images that apply to every color. */
  colorId?: string;
  /** CSS object-position, e.g. "50% 35%". */
  objectPosition?: string;
  /** Set once a real photo has been reviewed against an approved sample. */
  approved?: boolean;
};

export type ColorOption = {
  id: string;
  name: string;
  /** Swatch display only. Selection is never communicated by color alone. */
  swatch: string;
};

export type SizeOption = {
  id: string;
  name: string;
  /** Measured range, only when supplied by the production partner and verified. */
  measuredRange?: { minCm: number; maxCm: number } | null;
};

export type Variant = {
  id: string;
  colorId: string;
  sizeId: string | null;
  price: Money;
  available: boolean;
  /** Shown when unavailable, e.g. "Temporarily unavailable from our production partner". */
  availabilityNote?: string;
};

export type FitFamilyId = "structured";

export type FitInfo = {
  family: FitFamilyId;
  /** Short descriptor shown on cards, e.g. "Relaxed · low profile". */
  label: string;
  structure: "unstructured" | "structured" | null;
  profile: "low" | "mid" | "high" | null;
  closure: string | null;
  adjustable: boolean;
  /** Head circumference range. Null until measured from approved samples. */
  measuredRange: { minCm: number; maxCm: number } | null;
  crownHeightCm: number | null;
  brimLengthCm: number | null;
  /** True only when every value above comes from verified supplier/sample data. */
  verified: boolean;
  notes?: string;
};

/** Null fields mean "not yet verified". Components hide or label them accordingly. */
export type ConstructionInfo = {
  material: string | null;
  panelCount: number | null;
  decoration: string | null;
  care: string | null;
  verified: boolean;
};

export type ProductionInfo = {
  madeToOrder: true;
  /** "embroidery" may be stated as "embroidered to order" only when confirmed. */
  decorationMethod: "embroidery" | "print" | "patch" | null;
  decorationConfirmed: boolean;
};

export type ProductStatus = "demo" | "draft" | "published";

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** One short style line for cards and metadata. */
  tagline: string;
  description: { text: string; verified: boolean };
  price: Money;
  colors: ColorOption[];
  sizes: SizeOption[];
  variants: Variant[];
  images: ProductImageData[];
  fit: FitInfo;
  construction: ConstructionInfo;
  production: ProductionInfo;
  shippingProfileId: string;
  policyRefs: { returns: string; shipping: string };
  featured: boolean;
  /** Lower ranks appear first in "Featured" sort. */
  featuredRank: number;
  status: ProductStatus;
  tags: string[];
};

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  colorName: string;
  sizeName: string | null;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  image: ProductImageData | null;
  available: boolean;
};

export type ShippingQuote =
  | { status: "unconfigured"; message: string }
  | { status: "at-checkout"; message: string; amount: Money | null };

export type Cart = {
  lines: CartLine[];
  totalQuantity: number;
  subtotal: Money;
  /** Real configured discounts only. Empty until a discount system is connected. */
  discounts: { label: string; amount: Money }[];
  shipping: ShippingQuote;
  /** Lines that were in the stored cart but no longer resolve to a sellable variant. */
  removedLines: { variantId: string; reason: string }[];
};

export type Review = {
  id: string;
  productId: string;
  variantId?: string;
  author: string;
  rating: number;
  body: string;
  /** Source system that verified the purchase, e.g. a review provider. */
  source: string;
  verifiedPurchase: boolean;
  createdAt: string;
  imageSrc?: string;
};
