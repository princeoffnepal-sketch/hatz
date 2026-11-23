/**
 * Brand identity, navigation, support and editable copy.
 * This is the single place to rename the brand or change site-wide wording.
 *
 * Leave a value as `null` when it isn't real yet. Components hide unset social
 * links and show an explicit "not yet configured" state for unset support details.
 */

export const site = {
  name: "Exclusive Hatz",
  /** Used in <title> templates and metadata. */
  shortDescription: "Statement snapbacks. $50–$55. Free U.S. shipping with 2+ hats.",
  /** Optional logo file in /public. When null, the text wordmark is used. */
  logo: { src: "/brand/wordmark.png", width: 1254, height: 1254 },

  /** Canonical origin for metadata and Stripe return URLs. Set NEXT_PUBLIC_SITE_URL in production. */
  url: process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),

  serviceStrip: {
    text: "Free U.S. shipping with 2+ hats.",
    linkLabel: "Shipping details",
    href: "/shipping",
  },

  nav: [
    { label: "Shop", href: "/shop" },
    { label: "Fit Guide", href: "/fit-guide" },
    { label: "Our Process", href: "/our-process" },
    { label: "Help", href: "/help" },
  ],

  footerNav: [
    {
      heading: "Shop",
      links: [
        { label: "All hats", href: "/shop" },
        { label: "Search", href: "/search" },
        { label: "Bag", href: "/cart" },
      ],
    },
    {
      heading: "Help",
      links: [
        { label: "Fit guide", href: "/fit-guide" },
        { label: "Our process", href: "/our-process" },
        { label: "Shipping & delivery", href: "/shipping" },
        { label: "Returns & cancellations", href: "/returns" },
        { label: "Contact", href: "/help" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ],

  /** Set a URL to show a link. Null hides it (never links to "#"). */
  social: {
    instagram: null as string | null,
    tiktok: null as string | null,
    pinterest: null as string | null,
    youtube: null as string | null,
  },

  support: {
    /** Real, monitored inbox. Required before launch. */
    email: "exclusivehatzz@gmail.com" as string | null,
    /** Honest expectation once known, e.g. "We reply within two business days." */
    responseTime: null as string | null,
  },

  /** Legal business identity shown in the footer and policy pages. Required before launch. */
  business: {
    legalName: "Mogfit" as string | null,
    address: null as string | null,
  },

  copy: {
    hero: {
      eyebrow: "Exclusive Hatz · Made to order",
      headline: "Make your mark.",
      body: "Standout snapbacks. Bold details. Find the finishing touch that feels like you.",
      primaryCta: { label: "Shop hats", href: "/shop" },
      secondaryCta: { label: "How it works", href: "/our-process" },
    },
    brandIntro: {
      heading: "Your style. Your signature.",
      // Replace with your real design direction. Do not add an invented history.
      body: [
        "Exclusive Hatz is about the finishing touch. Expressive headwear, personal style, and a design you want to wear again.",
        "Each design is produced by our production partner after you order. We handle your questions, problems and returns directly.",
      ],
    },
    detail: {
      heading: "Up close",
      body: "Look closer. Gold-tone accents, detailed artwork and a black base that lets every detail speak. See each hat from every supplied angle before you choose.",
    },
  },

  /** Homepage FAQ. Keep answers consistent with the shipping and returns configuration. */
  faq: [
    {
      q: "What does made to order mean?",
      a: "Your hat is made or decorated by our production partner after you place your order. We don't hold finished stock, so production happens before your hat ships.",
    },
    {
      q: "How long will delivery take?",
      a: "Shipping within the USA costs $7.50 for one hat and is free with 2 or more hats. Estimated delivery is 3–5 business days from purchase to doorstep, including production.",
    },
    {
      q: "How do I know which fit to choose?",
      a: "Our hats have adjustable snapback closures. See the photos for each style and contact us if you need help with sizing.",
    },
    {
      q: "Can I cancel an order?",
      a: "Yes. Contact exclusivehatzz@gmail.com with your order number before your order ships. Orders cannot be canceled after shipment.",
    },
    {
      q: "What if something is wrong with my hat?",
      a: "If your hat arrives damaged, email your order number and photos. Return the damaged hat at your expense; after we receive it, we will send a replacement at no additional cost. Damaged hats are eligible for replacement, not a refund, subject to applicable rights.",
    },
    {
      q: "Who do I contact for help?",
      a: "Email exclusivehatzz@gmail.com. Include your order number if your question is about an order.",
    },
  ],
} as const;

export type SiteConfig = typeof site;
