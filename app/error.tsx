"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="container-site py-24">
      <h1 className="display text-5xl">Something went wrong.</h1>
      <p className="mt-4 max-w-md text-ink-soft">Please try again. Your bag is saved.</p>
      <div className="mt-8 flex gap-4">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Go home
        </Link>
      </div>
    </section>
  );
}
