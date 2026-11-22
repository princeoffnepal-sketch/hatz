import type { ReactNode } from "react";

/**
 * Native <details>/<summary> accordion: keyboard and screen-reader accessible
 * by default, works without JavaScript, animates where CSS supports it.
 */
export function Accordion({ items, headingLevel = 3 }: { items: { q: string; a: ReactNode }[]; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="border-t hairline">
      {items.map((item) => (
        <details key={item.q} className="accordion group border-b hairline">
          <summary className="flex min-h-14 items-center justify-between gap-6 py-4 text-left">
            <Heading className="text-base font-semibold sm:text-[1.0625rem]">{item.q}</Heading>
            <span
              aria-hidden="true"
              className="chevron relative inline-block size-4 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:bg-current after:absolute after:left-1/2 after:top-0 after:h-4 after:w-px after:bg-current"
            />
          </summary>
          <div className="max-w-prose pb-5 pr-8 text-[0.9375rem] leading-relaxed text-ink-soft">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  id,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  id?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-10">
      <div>
        {eyebrow && <p className="eyebrow mb-3 text-green">{eyebrow}</p>}
        <Tag id={id} className="display text-4xl sm:text-5xl">
          {title}
        </Tag>
      </div>
      {action}
    </div>
  );
}
