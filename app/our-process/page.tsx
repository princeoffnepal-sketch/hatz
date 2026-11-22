import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose } from "@/components/content/Content";
import { ProcessSteps } from "@/components/home/HomeSections";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Our process",
  description: "How a made-to-order hat goes from your order to your door.",
};

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our process"
        title="Made after you order."
        intro={`${site.name} brings you the collection. A production partner makes or decorates each one after it's ordered and ships it directly to you. We look after you the whole way.`}
      />
      <section aria-label="Steps" className="container-site">
        <ProcessSteps />
      </section>
      <section className="container-site mt-16 grid gap-10 md:mt-24 md:grid-cols-[1fr_1.6fr] md:gap-16">
        <h2 className="display text-4xl">Who does what</h2>
        <Prose>
          <h3>We select the collection and look after you</h3>
          <p>
            We select the hats we offer and show the actual product photos. We answer your questions and handle problems, returns
            and cancellations directly. You don&apos;t need to contact our production partner.
          </p>
          <h3>Our production partner makes it</h3>
          <p>
            After your order is accepted, our partner makes or decorates the hat and ships it to you. We hold no finished stock, which is
            why production happens before shipping.
          </p>
          <h3>Production and delivery are separate</h3>
          <p>
            Production time is how long it takes to make your hat. Transit time starts when the carrier receives it. Shipping is estimated at three business days after dispatch. Production timing is still being confirmed. Details are on the{" "}
            <Link href="/shipping" className="link text-ink">
              shipping page
            </Link>
            .
          </p>
          <h3>Quality</h3>
          <p>
            Before a design goes on sale, we review physical samples of it. Our detailed quality checks will be described here once the
            production partner and sample process are finalized.
          </p>
        </Prose>
      </section>
    </>
  );
}
