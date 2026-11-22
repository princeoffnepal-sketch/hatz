import Link from "next/link";
import { site } from "@/config/site";
import { reviews } from "@/data/reviews";
import { primaryImage } from "@/lib/catalog";
import { deliveryCopy } from "@/lib/disclosure";
import type { Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";
import { ProductGrid } from "../product/ProductCard";
import { ProductLink } from "../product/Tracking";
import { Accordion, SectionHeading } from "../ui/Accordion";
import { Icon } from "../ui/Icon";

export function Hero({ lead, second }: { lead: Product; second: Product }) {
  return <><section className="exclusive-hero" aria-labelledby="hero-title"><div className="container-site hero-inner">
    <div><p className="eyebrow enter">EXCLUSIVE HATZ / SNAPBACKS</p><h1 id="hero-title" className="enter enter-delay-1 mt-6">Make your<br />mark.</h1><p className="hero-copy enter enter-delay-2">{site.copy.hero.body}</p>
    <div className="flex flex-wrap gap-5 items-center enter enter-delay-3"><Link href="/shop" className="btn btn-light px-8">Shop the collection</Link><Link href="/shipping" className="link text-sm">Free shipping with 2+ hats</Link></div>
    <p className="mt-9 text-sm text-night-soft">Every snapback $65 · Made to order</p></div>
    <div className="hero-product enter enter-delay-2"><ProductLink href={`/products/${lead.slug}`} listId="home_hero" item={{ item_id: lead.id, item_name: lead.name, price: 65 }} className="block group">
      <ProductImage image={primaryImage(lead)} sizes="(min-width: 768px) 48vw, 100vw" priority />
      <div className="flex justify-between gap-4 p-5 text-sm"><span>{lead.name}</span><span>$65</span></div>
    </ProductLink><span className="hero-photo-caption">The details do the talking.</span></div>
    </div></section><div className="brand-ribbon"><span>9 standout snapbacks</span><span>$65 each</span><span>Free shipping with 2+ hats</span></div></>;
}

export function FeaturedDesigns({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="featured-title" className="container-site pb-14 pt-4 md:pb-20 md:pt-8">
      <SectionHeading
        id="featured-title"
        title="Featured designs"
        action={
          <Link href="/shop" className="link-arrow text-[0.9375rem]">
            Shop all hats
          </Link>
        }
      />
      <ProductGrid products={products} listId="home_featured" priorityCount={0} />
    </section>
  );
}

export function DetailEditorial({ product }: { product: Product | undefined }) {
  const detail = product?.images.find((img) => img.role === "detail") ?? product?.images[0];
  return <section aria-labelledby="detail-title" className="on-dark bg-night text-ivory">
    <div className="container-site grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-24">
      <div className="reveal"><ProductImage image={detail} sizes="(min-width: 768px) 45vw, 100vw" aspect="4 / 3" /></div>
      <div><p className="eyebrow text-night-soft">A closer look</p><h2 id="detail-title" className="display mt-4 text-5xl sm:text-6xl">Made to stand out.</h2>
      <p className="mt-5 max-w-md leading-relaxed text-night-soft">{site.copy.detail.body}</p>
      <p className="mt-6 text-sm text-night-soft">Actual product photos. The color you see is the color you choose.</p>
      {product && <Link href={`/products/${product.slug}`} className="btn btn-light mt-8">Explore {product.name}</Link>}</div>
    </div>
  </section>;
}

export function ProcessSteps() {
  const copy = deliveryCopy();
  const steps = [
    {
      icon: "cursor" as const,
      title: "Choose your design",
      text: "Choose your snapback in the exact color shown in the photos. Every hat is $65.",
      timing: "Order placed",
    },
    {
      icon: "needle" as const,
      title: "Production partner makes it",
      text: "Our production partner makes or decorates your hat to order. This is production time, before anything ships.",
      timing: copy.production,
    },
    {
      icon: "truck" as const,
      title: "Shipped to you",
      text: "The finished hat ships directly from our partner. Transit time starts when the carrier has it.",
      timing: copy.shipping,
    },
  ];
  return (
    <ol className="grid gap-px overflow-hidden border hairline bg-line md:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title} className="reveal flex flex-col bg-ivory p-6 sm:p-8">
          <div className="flex items-center justify-between">
              <Icon name={step.icon} size={22} className="text-green" />
          </div>
          <h3 className="display mt-8 text-3xl">{step.title}</h3>
          <p className="mb-6 mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{step.text}</p>
          <p className="mt-auto border-t hairline pt-4 text-sm font-medium">{step.timing}</p>
        </li>
      ))}
    </ol>
  );
}

export function ProcessSection() {
  return (
    <section aria-labelledby="process-title" className="container-site py-14 md:py-20">
      <SectionHeading
        id="process-title"
        eyebrow="Made to order"
        title="How your hat gets to you"
        action={
          <Link href="/our-process" className="link-arrow text-[0.9375rem]">
            Our process
          </Link>
        }
      />
      <ProcessSteps />
      <p className="mt-5 max-w-2xl text-sm text-ink-soft">
        Production and transit are separate stages. Faster shipping, if offered, only shortens transit.{" "}
        <Link href="/shipping" className="link text-ink">
          Shipping &amp; delivery details
        </Link>
      </p>
    </section>
  );
}

/** Renders only when genuine reviews exist. */
export function CommunitySection() {
  if (!reviews.length) return null;
  return (
    <section aria-labelledby="community-title" className="container-site py-14 md:py-20">
      <SectionHeading id="community-title" title="From people who ordered" />
      <ul className="grid gap-6 md:grid-cols-3">
        {reviews.slice(0, 3).map((review) => (
          <li key={review.id} className="border hairline p-6">
            <p className="text-sm" aria-label={`Rated ${review.rating} out of 5`}>
              {"★".repeat(review.rating)}
            </p>
            <blockquote className="mt-3 leading-relaxed">{review.body}</blockquote>
            <p className="mt-4 text-sm text-ink-soft">
              {review.author}
              {review.verifiedPurchase && ` · Verified purchase via ${review.source}`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BrandIntro({ image }: { image: Product["images"][number] | undefined }) {
  const intro = site.copy.brandIntro;
  return (
    <section aria-labelledby="brand-title" className="border-y hairline bg-ivory-deep">
      <div className="container-site grid items-center gap-10 py-14 md:grid-cols-[1fr_1.1fr] md:gap-16 md:py-20">
        <div className="order-2 md:order-1">
          <h2 id="brand-title" className="display text-4xl sm:text-5xl">
            {intro.heading}
          </h2>
          {intro.body.map((p) => (
            <p key={p} className="mt-5 max-w-lg leading-relaxed text-ink-soft">
              {p}
            </p>
          ))}
          <Link href="/our-process" className="link-arrow mt-8 text-[0.9375rem]">
            How we work
          </Link>
        </div>
        <div className="reveal order-1 md:order-2">
          <ProductImage image={image} sizes="(min-width: 768px) 48vw, 100vw" aspect="4 / 3" showKindBadge />
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="container-site grid gap-8 py-14 md:grid-cols-[1fr_1.6fr] md:gap-16 md:py-20">
      <div>
        <h2 id="faq-title" className="display text-4xl sm:text-5xl">
          Questions
        </h2>
        <p className="mt-4 max-w-xs text-[0.9375rem] text-ink-soft">
          Something else?{" "}
          <Link href="/help" className="link text-ink">
            Contact us
          </Link>
          .
        </p>
      </div>
      <Accordion items={site.faq.map((f) => ({ q: f.q, a: f.a }))} />
    </section>
  );
}
