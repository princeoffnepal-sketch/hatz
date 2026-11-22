import {
  BrandIntro,
  CommunitySection,
  DetailEditorial,
  FaqSection,
  FeaturedDesigns,
  Hero,
  ProcessSection,
} from "@/components/home/HomeSections";
import { sortProducts } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog.server";

export default function HomePage() {
  const products = sortProducts(getProducts(), "featured");
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const [lead, second] = [featured[1] ?? products[0], featured[0] ?? products[1]];
  const brandProduct = products.find((p) => p.id !== lead?.id && p.id !== second?.id);

  if (!products.length) {
    return (
      <section className="container-site py-24">
        <h1 className="display text-5xl">New designs are on the way.</h1>
        <p className="mt-4 text-ink-soft">No products are published yet.</p>
      </section>
    );
  }

  return (
    <>
      {lead && second && <Hero lead={lead} second={second} />}
      <FeaturedDesigns products={featured} />
      <DetailEditorial product={products.find((p) => p.slug === "saint-and-cross")} />
      <ProcessSection />
      <CommunitySection />
      <BrandIntro image={brandProduct?.images[0]} />
      <FaqSection />
    </>
  );
}
