import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/auth.server";
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/content/Content";
import { getGate } from "@/lib/checkout/gate.server";

export const metadata: Metadata = { title: "Launch readiness", robots: { index: false, follow: false } };

/**
 * Internal launch checklist (hidden in live mode). Shows pass/fail status only;
 * it never displays secrets, costs or supplier data.
 */
export default async function LaunchReadinessPage() {
  if(!await isAdmin()) redirect("/admin");
  const gate = getGate();
  if (gate.mode === "live") notFound();
  const required = gate.checks.filter((c) => c.required);
  const passed = gate.checks.filter((c) => c.ok).length;

  return (
    <>
      <PageHeader
        eyebrow="Internal"
        title="Launch readiness"
        intro={
          <>
            Store mode: <strong className="text-ink">{gate.mode}</strong>. Checkout is{" "}
            <strong className="text-ink">{gate.checkoutEnabled ? "enabled" : "disabled"}</strong>. {passed} of {gate.checks.length} checks pass.
            {gate.mode === "demo" && " Every check is required for live mode; this page is hidden once live."}
          </>
        }
      />
      <div className="container-site max-w-3xl">
        <ul className="divide-y divide-line border-y hairline">
          {gate.checks.map((check) => (
            <li key={check.id} className="py-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${check.ok ? "bg-green text-ivory" : "bg-alert-tint text-alert"}`}
                  aria-hidden="true"
                >
                  {check.ok ? "✓" : "!"}
                </span>
                <div>
                  <p className="font-semibold">
                    {check.label}
                    <span className="sr-only">{check.ok ? ": passing" : ": not passing"}</span>
                    {required.includes(check) && gate.mode !== "demo" && <span className="ml-2 text-xs font-normal text-ink-soft">required now</span>}
                  </p>
                  {check.details.length > 0 && (
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-ink-soft">
                      {check.details.slice(0, 12).map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                      {check.details.length > 12 && <li>…and {check.details.length - 12} more</li>}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
