import type { Metadata } from "next";
import { DraftBanner, PageHeader, Pending, Prose } from "@/components/content/Content";
import { policies } from "@/config/policies";

export const metadata: Metadata = { title: "Privacy policy (draft)", robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHeader title="Privacy policy" />
      <div className="container-site max-w-3xl space-y-10">
        <DraftBanner policy={policies.privacy} />
        <Prose>
          <p>
            This draft lists the topics the final privacy policy needs to cover. Replace it with a policy reviewed for the business before
            launch.
          </p>
          <h2>Topics to cover</h2>
          <ul>
            <li>Who operates the store (legal business name and contact): <Pending /></li>
            <li>What we collect: order details, shipping address and contact email collected at checkout by the payment provider</li>
            <li>Who we share data with: payment provider, production partner (for fulfillment), carriers</li>
            <li>Analytics and cookies: a functional cart cookie, a private admin session cookie, and first-party shopping events with a random browser-session identifier. Events contain page paths, event names and product identifiers, not customer names or emails. Marketing pixels are not enabled. Shopping events are retained for up to 90 days and collection respects browser Do Not Track and Global Privacy Control signals</li>
            <li>Email marketing: only with consent, once a provider is connected</li>
            <li>Contact messages and newsletter sign-ups are saved in the private admin inbox. Final retention, access and deletion contacts: <Pending /></li>
            <li>Applicable privacy laws for the regions served: <Pending /></li>
          </ul>
        </Prose>
      </div>
    </>
  );
}
