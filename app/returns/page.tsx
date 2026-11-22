import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/content/Content";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Returns & cancellations", description: "Cancellation, eligible refunds and damaged-item replacements at Exclusive Hatz." };

export default function ReturnsPage() {
  return <>
    <PageHeader eyebrow="Customer care" title="Returns & cancellations" intro="Need help with an order? Contact us directly and include your order number." />
    <div className="container-site"><Prose>
      <p><a href={`mailto:${site.support.email}`} className="link">{site.support.email}</a></p>
      <h2>Cancellation policy</h2>
      <p>You may cancel your order before it has shipped. If the order has already shipped, it cannot be canceled. Email us with your order number to request cancellation.</p>
      <h2>Refund policy</h2>
      <p>To request a refund for an eligible hat, contact us within 14 days of delivery with your order number. Hats must be unused, unworn, undamaged and returned with their original tags and packaging.</p>
      <p>Contact us for approval and return instructions before sending anything back. The customer pays return shipping. Once the returned hat has been received, inspected and approved, the refund will be issued to the original payment method. Your bank or payment provider determines when the credit appears.</p>
      <h2>Damaged items</h2>
      <p>If your hat arrives damaged, contact us promptly with your order number and photos of the damage. Please keep the packaging and contact us for return instructions.</p>
      <p>The damaged item must be returned to us. The customer pays the return shipping cost. Once we receive it, we will send a replacement hat at no additional cost, including shipping the replacement to you.</p>
      <p>Damaged arrivals are handled through replacement rather than a refund. Damage caused by wear, misuse or alteration after delivery is not eligible under this arrival-damage policy.</p>
      <h2>Before returning a hat</h2>
      <p>Email us first to receive the return address and instructions. Do not send a return to the shipping origin without our confirmation.</p>
      <p>Nothing in this policy limits any rights you have under applicable law.</p>
    </Prose></div>
  </>;
}
