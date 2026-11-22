"use client";

import { useEffect, useState, type RefObject } from "react";
import { formatMoney } from "@/lib/money";
import type { Money } from "@/lib/types";

type Props = {
  ctaRef: RefObject<HTMLButtonElement | null>;
  formId: string;
  optionsId: string;
  disclosureId: string;
  price: Money;
  complete: boolean;
  unavailable: boolean;
  name: string;
};

/**
 * Mobile-only bar that appears after the main Add to bag button scrolls out
 * of view above. It hides while the on-screen keyboard is open. Dialogs use
 * the browser top layer, so this bar can never cover them.
 */
export function StickyPurchaseBar({ ctaRef, formId, optionsId, disclosureId, price, complete, unavailable, name }: Props) {
  const [pastCta, setPastCta] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // A passive scroll check rather than IntersectionObserver: large jumps (flings,
  // anchor links, restored scroll) can skip past the button without an intersection.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const cta = ctaRef.current;
      if (cta) setPastCta(cta.getBoundingClientRect().bottom < 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ctaRef]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  const visible = pastCta && !keyboardOpen;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t hairline bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-transform duration-300 ease-out md:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="container-site flex items-center gap-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {name} · {formatMoney(price)}
          </p>
          <a href={`#${disclosureId}`} className="link text-xs text-ink-soft">
            Made to order · delivery details
          </a>
        </div>
        {complete && !unavailable ? (
          <button type="submit" form={formId} className="btn btn-primary min-h-11 shrink-0 px-5">
            Add to bag
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-outline min-h-11 shrink-0 px-5"
            onClick={() => {
              const options = document.getElementById(optionsId);
              options?.scrollIntoView({ behavior: "smooth", block: "center" });
              options?.querySelector<HTMLInputElement>("input:not(:disabled):not(:checked)")?.focus({ preventScroll: true });
            }}
          >
            {unavailable ? "Change option" : "Choose options"}
          </button>
        )}
      </div>
    </div>
  );
}
