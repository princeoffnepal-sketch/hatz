import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductExperience } from "@/components/product/ProductExperience";
import { Accordion } from "@/components/ui/Accordion";
import { delivery } from "@/config/delivery";
import { policies } from "@/config/policies";
import { fitFamilies } from "@/data/catalog";
import { reviews } from "@/data/reviews";
import { relatedProducts } from "@/lib/catalog";
import { getProductBySlug, getProducts } from "@/lib/catalog.server";
import { deliveryCopy, madeToOrderLine } from "@/lib/disclosure";
import { formatMoney } from "@/lib/money";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    alternates: {canonical:`/products/${product.slug}`},
    openGraph: {title:product.name,description:product.tagline,images:product.images.filter(i=>i.kind==="photo").slice(0,1).map(i=>({url:i.src,alt:product.name}))},
    description: `${product.tagline} ${formatMoney(product.price)}. Made after you order.`,
    robots: product.status === "demo" ? { index: false } : undefined,
  };
}

function Pending({ children }: { children: React.ReactNode }) {
  return <span className="text-ink-soft">{children}</span>;
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = relatedProducts(getProducts(), product, 3);
  const productReviews = reviews.filter((r) => r.productId === product.id);
  const family = fitFamilies[product.fit.family];
  const copy = deliveryCopy(delivery);
  const c = product.construction;

  const details = [
    {
      q: "Product details",
      a: (
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
          <dt className="text-ink">Material</dt>
          <dd>{c.material ?? <Pending>Not specified from the supplier specification</Pending>}</dd>
          <dt className="text-ink">Panels</dt>
          <dd>{c.panelCount ?? <Pending>Not specified</Pending>}</dd>
          <dt className="text-ink">Decoration</dt>
          <dd>{c.decoration ?? <Pending>Not specified with the production partner</Pending>}</dd>
          <dt className="text-ink">Colors</dt>
          <dd>{product.colors.map((col) => col.name).join(", ")}</dd>
        </dl>
      ),
    },
    {
      q: "Fit",
      a: (
        <>
          <p>
            {family.name}: {family.summary}
          </p>
          <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
            <dt className="text-ink">Crown</dt>
            <dd>{product.fit.structure ? `${product.fit.structure[0].toUpperCase()}${product.fit.structure.slice(1)}` : <Pending>Not specified</Pending>}</dd>
            <dt className="text-ink">Profile</dt>
            <dd>{product.fit.profile ? `${product.fit.profile[0].toUpperCase()}${product.fit.profile.slice(1)}` : <Pending>Not specified</Pending>}</dd>
            <dt className="text-ink">Closure</dt>
            <dd>{product.fit.closure ?? (product.sizes.length ? "Sized (no adjustment)" : <Pending>Not specified</Pending>)}</dd>
            <dt className="text-ink">Head size</dt>
            <dd>
              {product.fit.measuredRange
                ? `${product.fit.measuredRange.minCm}–${product.fit.measuredRange.maxCm} cm`
                : <Link className="link" href="/help">Contact us for sizing help</Link>}
            </dd>
          </dl>
          {!product.fit.verified && <p className="mt-3 text-xs">An adjustable closure does not guarantee every head size. Ask us before ordering if you need a specific fit.</p>}
          <Link href="/fit-guide" className="link mt-3 inline-block text-ink">
            Read the fit guide
          </Link>
        </>
      ),
    },
    {
      q: "Production & delivery",
      a: (
        <>
          <p>
            {madeToOrderLine(product)} Our production partner makes it after your order is accepted, then ships it directly to you.
            We handle all customer support.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>{copy.production}</li>
            <li>{copy.shipping}</li>
          </ul>
          <Link href="/our-process" className="link mt-3 inline-block text-ink">
            How it works
          </Link>
        </>
      ),
    },
    {
      q: "Returns & cancellations",
      a: (
        <>
          <p>{policies.returns.summary}</p>
          <Link href="/returns" className="link mt-3 inline-block text-ink">
            Returns &amp; cancellations
          </Link>
        </>
      ),
    },
    ...(c.care ? [{ q: "Care", a: <p>{c.care}</p> }] : []),
  ];

  return (
    <>
      <div className="container-site pt-4 md:pt-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-soft md:mb-6">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/shop" className="hover:text-ink hover:underline">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
        <ProductExperience product={product} />
      </div>

      <section aria-labelledby="details-title" className="container-site mt-16 grid gap-8 md:mt-24 md:grid-cols-[1fr_1.6fr] md:gap-16">
        <h2 id="details-title" className="display text-4xl">
          The details
        </h2>
        <Accordion items={details} />
      </section>

      {productReviews.length > 0 && (
        <section aria-labelledby="reviews-title" className="container-site mt-16">
          <h2 id="reviews-title" className="display text-4xl">
            Reviews
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-2">
            {productReviews.map((r) => (
              <li key={r.id} className="border hairline p-6">
                <p aria-label={`Rated ${r.rating} out of 5`}>{"★".repeat(r.rating)}</p>
                <p className="mt-3">{r.body}</p>
                <p className="mt-3 text-sm text-ink-soft">
                  {r.author} · {r.source}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-site mt-20 md:mt-28">
          <h2 id="related-title" className="display mb-8 text-4xl">
            You might also like
          </h2>
          <ProductGrid products={related} listId={`related_${product.id}`} columns={3} priorityCount={0} />
        </section>
      )}
    </>
  );
}
