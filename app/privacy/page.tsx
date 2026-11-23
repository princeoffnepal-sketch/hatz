import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/content/Content";
export const metadata: Metadata = { title: "Privacy policy" };
export default function Page() {
  return <><PageHeader title="Privacy policy" intro="Effective November 22, 2026" /><div className="container-site max-w-3xl"><Prose>
    <p>Exclusive Hatz is operated by Mogfit. For privacy questions or requests, email <a href="mailto:exclusivehatzz@gmail.com">exclusivehatzz@gmail.com</a>.</p>
    <h2>Information we collect</h2><p>When you order, we receive your name, email, shipping address, purchased items, payment status and order reference. Stripe processes your payment details; our website does not store your full card number. We also store messages you send through our contact form and email addresses you voluntarily submit for product updates.</p>
    <h2>How we use and share information</h2><p>We use this information to process orders, arrange manufacturing and shipping, provide support, handle refunds and disputes, and maintain business records. Our service providers include Stripe for payments, Vercel for hosting and Turso for database storage. We share the information needed to fulfill an order with our fulfillment partner and carriers. Authorized store administrators can access order and support information. We do not sell your personal information or enable advertising pixels on this website.</p>
    <h2>Cookies and shopping activity</h2><p>A cart cookie remembers your bag for up to 30 days. A private session cookie keeps administrators signed in. First-party shopping analytics use a random browser-session identifier and record page paths, product identifiers and shopping events, without your name or email. Analytics collection respects browser Do Not Track and Global Privacy Control signals. Shopping events are retained for up to 90 days.</p>
    <h2>Retention and your choices</h2><p>Order and transaction records are retained as needed to fulfill orders, handle disputes and meet recordkeeping obligations. Contact messages and sign-ups are retained until no longer needed or until an applicable deletion request is processed. Email us to request access, correction, deletion or removal from the product-update list. We may need to verify your request and retain records where required for transactions or legal obligations.</p>
    <h2>Updates</h2><p>We may update this policy as our services change. The effective date above identifies the current version.</p>
  </Prose></div></>;
}
