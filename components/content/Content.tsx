import type { ReactNode } from "react";
import type { PolicyRef } from "@/config/policies";

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: ReactNode }) {
  return (
    <header className="container-site pt-10 pb-8 md:pt-16 md:pb-12">
      {eyebrow && <p className="eyebrow mb-4 text-green">{eyebrow}</p>}
      <h1 className="display max-w-3xl text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
      {intro && <div className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-soft">{intro}</div>}
    </header>
  );
}

/** Banner for policy pages that aren't final. Draft text must never read as a finished policy. */
export function DraftBanner({ policy }: { policy: PolicyRef }) {
  if (policy.status === "final") {
    return policy.effectiveDate ? <p className="text-sm text-ink-soft">Effective {policy.effectiveDate}</p> : null;
  }
  return (
    <div className="notice" role="note">
      <p className="font-semibold text-ink">Draft: not a finalized policy.</p>
      <p className="mt-1 text-ink-soft">
        This page shows the structure the final policy will follow. It will be replaced with reviewed terms from the business
        before the store accepts orders. Nothing here is a binding commitment yet.
      </p>
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-2xl space-y-5 text-[1rem] leading-relaxed text-ink-soft [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:tracking-[-0.015em] [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mt-1.5 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}

export function Pending({ children = "To be confirmed" }: { children?: ReactNode }) {
  return (
    <span className="rounded-[2px] bg-note px-1.5 py-0.5 text-[0.8125rem] font-medium text-ink">{children}</span>
  );
}
