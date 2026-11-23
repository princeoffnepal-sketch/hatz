import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose } from "@/components/content/Content";

export const metadata: Metadata = { title: "Shipping & delivery", description: "Free U.S. shipping with 2+ hats; otherwise $7.50 for one hat. Estimated delivery in 3–5 business days from purchase, including production." };

export default function ShippingPage() {
  return <>
    <PageHeader eyebrow="Delivery" title="Two hats. Free shipping." intro="United States only. Shipping is free when your order contains two or more hats." />
    <div className="container-site">
      <div className="grid max-w-3xl gap-px border hairline bg-line sm:grid-cols-2 mb-12">
        <div className="bg-paper p-8"><p className="eyebrow">Shipping cost</p><p className="display text-5xl mt-4">Free</p><p className="mt-3 text-ink-soft">With 2+ hats. For one hat, shipping is $7.50.</p></div>
        <div className="bg-paper p-8"><p className="eyebrow">Estimated delivery</p><p className="display text-5xl mt-4">3–5 business days</p><p className="mt-3 text-ink-soft">From purchase to doorstep, including production. This is an estimate, not a guaranteed arrival date.</p></div>
      </div>
      <Prose>
        <h2>Production comes first</h2>
        <p>Your hat is made or customized after you order, then shipped directly by our production partner. The estimated 3–5 business days includes both production and shipping. Business days are Monday through Friday, excluding holidays.</p>
        <p>If an order is delayed, contact us for an updated estimate. We will contact affected customers about delays and arrange a revised date or cancellation before shipment.</p>
        <h2>Shipping charges</h2><p>One hat: $7.50. Two or more hats in the same order: free shipping, including mixed designs. The shipping charge is shown in your bag before payment.</p>
        <h2>Where we ship</h2><p>United States only. International shipping is not currently offered.</p>
        <h2>Shipping questions</h2><p>For questions about dispatch, tracking or a delayed package, email <a className="link" href="mailto:exclusivehatzz@gmail.com">exclusivehatzz@gmail.com</a> with your order number.</p>
        <h2>Need to cancel?</h2><p>You can cancel before your order ships. Once shipped, it cannot be canceled. <Link className="link" href="/returns">Read our cancellation and return policy.</Link></p>
      </Prose>
    </div>
  </>;
}
