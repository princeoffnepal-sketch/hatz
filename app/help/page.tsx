import { databaseConfigured, runtime } from "@/lib/admin/db.server";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/Content";
import { ContactForm } from "@/components/forms/Forms";
import { Accordion } from "@/components/ui/Accordion";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Help & contact",
  description: "Get help with an order, fit, returns or anything else.",
};

export default function HelpPage() {
  const email = site.support.email;
  return (
    <>
      <PageHeader eyebrow="Help" title="How can we help?" intro="We handle every question and problem directly, including anything to do with production or delivery." />
      <div className="container-site grid gap-12 md:grid-cols-[1fr_1.5fr] md:gap-16">
        <aside className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Contact</h2>
            {email ? (
              <p className="mt-2">
                <a href={`mailto:${email}`} className="link">
                  {email}
                </a>
              </p>
            ) : (
              <p className="notice mt-3">Send a message using the form. Your message is saved directly to our support inbox.</p>
            )}
            {site.support.responseTime && <p className="mt-2 text-sm text-ink-soft">{site.support.responseTime}</p>}
          </div>
          <nav aria-label="Help topics">
            <h2 className="text-lg font-semibold">Quick links</h2>
            <ul className="mt-2 space-y-0.5">
              {[
                ["Shipping & delivery", "/shipping"],
                ["Returns & cancellations", "/returns"],
                ["Fit guide", "/fit-guide"],
                ["Our process", "/our-process"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="link inline-flex min-h-11 items-center">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <section aria-labelledby="contact-title">
          <h2 id="contact-title" className="display mb-6 text-4xl">
            Send us a message
          </h2>
          <ContactForm configured={databaseConfigured() || Boolean(runtime("CONTACT_FORM_ENDPOINT"))} supportEmail={email} />
        </section>
      </div>
      <section aria-labelledby="help-faq" className="container-site mt-20 grid gap-8 md:grid-cols-[1fr_1.5fr] md:gap-16">
        <h2 id="help-faq" className="display text-4xl">
          Common questions
        </h2>
        <Accordion items={site.faq.map((f) => ({ q: f.q, a: f.a }))} />
      </section>
    </>
  );
}
