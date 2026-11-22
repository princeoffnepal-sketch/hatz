import type { Metadata } from "next";
import { DraftBanner, PageHeader, Pending, Prose } from "@/components/content/Content";
import { policies } from "@/config/policies";

export const metadata: Metadata = { title: "Terms of service (draft)", robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHeader title="Terms of service" />
      <div className="container-site max-w-3xl space-y-10">
        <DraftBanner policy={policies.terms} />
        <Prose>
          <p>
            This draft lists the topics the final terms need to cover. Replace it with terms reviewed for the business before launch.
          </p>
          <h2>Topics to cover</h2>
          <ul>
            <li>Business identity and contact: <Pending /></li>
            <li>Made-to-order products, production and delivery estimates, and what happens if they change</li>
            <li>Pricing, taxes and shipping charges</li>
            <li>Cancellations, returns and remedies, consistent with the returns policy</li>
            <li>Product images and color representation</li>
            <li>Governing law and dispute resolution: <Pending /></li>
          </ul>
        </Prose>
      </div>
    </>
  );
}
