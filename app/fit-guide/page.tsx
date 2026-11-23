import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/Content";
import { ProductImage } from "@/components/ProductImage";
import { FitGuideTracker } from "@/components/content/FitGuideTracker";
import { fitFamilies } from "@/data/catalog";
import { getProducts } from "@/lib/catalog.server";

export const metadata: Metadata = {
  title: "Fit guide",
  description: "Compare our hat shapes and learn how to measure your head.",
};

export default function FitGuidePage() {
  const products = getProducts();
  const families = Object.values(fitFamilies);

  return (
    <>
      <FitGuideTracker />
      <PageHeader
        eyebrow="Fit guide"
        title="Find the shape that suits you."
        intro="Our collection features adjustable snapbacks. Check each product gallery for the shape, details and closure. Contact us if you need help with a specific head size."
      />

      <section aria-labelledby="compare-title" className="container-site">
        <h2 id="compare-title" className="sr-only">
          Compare shapes
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {families.map((family) => {
            const example = products.find((p) => p.fit.family === family.id);
            const side = example?.images.find((img) => img.role === "side" && img.colorId === example.colors[0]?.id);
            return (
              <article key={family.id} className="border hairline bg-paper">
                <ProductImage image={side} sizes="(min-width: 768px) 45vw, 100vw" aspect="4 / 3" showKindBadge />
                <div className="p-6">
                  <h3 className="display text-4xl">{family.name}</h3>
                  <p className="mt-2 text-ink-soft">{family.summary}</p>
                  <Link href={`/shop?fit=${family.id}`} className="link mt-4 inline-flex min-h-11 items-center font-semibold">
                    Shop {family.name.toLowerCase()} hats
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 max-w-2xl text-ink-soft">Each design has an adjustable snapback closure. An adjustable fit may not suit every head size. If you need a specific fit, send us your measurement and design name before ordering.</p>
      </section>

      <section aria-labelledby="measure-title" className="container-site mt-16 grid items-center gap-10 md:mt-24 md:grid-cols-2 md:gap-16">
        <figure className="frame flex items-center justify-center p-8" style={{ aspectRatio: "5 / 4" }}>
          <svg viewBox="0 0 400 320" className="h-full w-full max-w-sm" role="img" aria-labelledby="measure-svg-title">
            <title id="measure-svg-title">Diagram: wrap a soft tape around your head, just above the ears and across the forehead.</title>
            <ellipse cx="200" cy="170" rx="110" ry="125" fill="#d6cfbf" />
            <path d="M200 295 L200 320" stroke="#d6cfbf" strokeWidth="60" />
            <ellipse cx="200" cy="150" rx="118" ry="30" fill="none" stroke="#214f3d" strokeWidth="5" strokeDasharray="10 6" />
            <circle cx="318" cy="150" r="7" fill="#214f3d" />
            <text x="200" y="40" textAnchor="middle" fontSize="15" fill="#4a4d48">Measure here</text>
            <path d="M200 48 L200 112" stroke="#4a4d48" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <defs>
              <marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 Z" fill="#4a4d48" />
              </marker>
            </defs>
          </svg>
        </figure>
        <div>
          <h2 id="measure-title" className="display text-4xl sm:text-5xl">
            How to measure your head
          </h2>
          <ol className="mt-6 space-y-4 text-ink-soft">
            {[
              "Use a soft tape measure, or a piece of string and a ruler.",
              "Wrap it around your head about a finger's width above your eyebrows and just above your ears.",
              "Keep it level and snug, not tight. Note the measurement in centimeters or inches.",
              "Send us your measurement and the design name if you need help deciding before you order.",
            ].map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="font-mono text-sm text-ink">0{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-ink-soft">
            Need help with sizing?{" "}
            <Link href="/help" className="link text-ink">
              Ask us
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
