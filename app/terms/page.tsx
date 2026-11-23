import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose } from "@/components/content/Content";
export const metadata: Metadata = { title: "Terms of service" };
export default function Page() {
  return <><PageHeader title="Terms of service" intro="Effective November 22, 2026" /><div className="container-site max-w-3xl"><Prose>
    <h2>Who you are buying from</h2><p>Exclusive Hatz is operated by Mogfit, which collects customer payments and handles refunds and disputes. Your card statement may show MOGFIT. Contact <a href="mailto:exclusivehatzz@gmail.com">exclusivehatzz@gmail.com</a> for order support.</p>
    <h2>Products and orders</h2><p>We sell adjustable snapback hats made or decorated after purchase and shipped by our fulfillment partner. Each listing shows the offered design and color. Screen settings and lighting may affect how colors appear. We do not promise materials or measurements that are not stated in the listing.</p>
    <h2>Prices and payment</h2><p>Prices are in U.S. dollars. Each hat costs $65. U.S. shipping is $7.50 for one hat and free for two or more hats in the same order. The checkout page shows the final amount and any applicable tax before you authorize payment. Stripe processes payments. A successful payment confirmation identifies your order; an item in your bag alone does not place an order.</p>
    <h2>Delivery and fulfillment</h2><p>Estimated delivery is 3–5 business days from purchase to doorstep, including production. Business days exclude weekends and holidays. Estimates are not guaranteed dates. We handle order support and fulfillment issues even though a partner produces and ships the hats. See our <Link href="/shipping">shipping policy</Link> for destinations, charges and delay support.</p>
    <h2>Cancellations, returns and damaged items</h2><p>You may cancel before shipment. Eligible unused hats may be returned under our <Link href="/returns">returns and cancellation policy</Link>. Contact us before returning an item so we can provide return instructions. The policy also explains damaged-item replacements and return shipping. Nothing in these terms limits rights or remedies that cannot be excluded under applicable law.</p>
    <h2>Problems with an order</h2><p>Please contact us with your order reference if a payment, delivery or product is incorrect. If we cannot fulfill an order, we will contact you and arrange an appropriate refund. We may correct listing errors; we will not increase the amount of an already-paid order without your agreement.</p>
  </Prose></div></>;
}
