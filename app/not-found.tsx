import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-site grid min-h-[60vh] items-center py-20">
      <div className="max-w-xl">
        <p className="font-mono text-sm tracking-widest text-ink-soft">404</p>
        <h1 className="display mt-4 text-6xl sm:text-7xl">This page wandered off.</h1>
        <p className="mt-5 text-ink-soft">The link may be old, or the design may no longer be available.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/shop" className="btn btn-primary">
            Shop hats
          </Link>
          <Link href="/search" className="btn btn-outline">
            Search
          </Link>
        </div>
      </div>
    </section>
  );
}
