"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { contactAction, newsletterAction, type FormState } from "@/lib/forms/actions";

const idle: FormState = { status: "idle" };

function StatusMessage({ state, unconfiguredText, dark }: { state: FormState; unconfiguredText: string; dark?: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status === "sent" || state.status === "error" || state.status === "unconfigured") ref.current?.focus();
  }, [state]);
  if (state.status === "idle" || state.status === "invalid") return null;
  const tone =
    state.status === "sent"
      ? dark
        ? "text-[#a9d2bd]"
        : "text-green"
      : state.status === "unconfigured"
        ? dark
          ? "text-night-soft"
          : "text-ink-soft"
        : dark
          ? "text-[#f0b4a6]"
          : "text-alert";
  return (
    <p ref={ref} tabIndex={-1} role={state.status === "error" ? "alert" : "status"} className={`mt-3 text-sm font-medium outline-none ${tone}`}>
      {state.status === "unconfigured" ? unconfiguredText : state.message}
    </p>
  );
}

/** Newsletter signup saves to the private database or a configured provider. */
export function NewsletterForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(newsletterAction, idle);
  const id = useId();
  const error = state.status === "invalid" ? state.errors.email : null;
  return (
    <form action={action} noValidate className="max-w-md">
      <div className="hidden" aria-hidden="true"><label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label></div>
      <label htmlFor={id} className="text-sm font-semibold">
        Email for new designs
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.status === "invalid" ? state.values.email : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
          className="field border-[#6b6c66] bg-transparent text-ivory placeholder:text-night-soft/70 hover:border-night-soft focus-visible:border-ivory"
          placeholder="name@example.com"
        />
        <button type="submit" className="btn btn-light shrink-0" disabled={pending}>
          {pending ? "Sending…" : "Sign up"}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-[#f0b4a6]">
          {error}
        </p>
      )}
      <p id={`${id}-help`} className="mt-2 text-xs text-night-soft">
        {configured
          ? "Sign up for occasional emails about new designs. Your address is saved to our private list."
          : "Email signup isn't connected yet. Submitting won't send or store your address."}
      </p>
      <StatusMessage
        state={state}
        dark
        unconfiguredText="Not sent: email signup isn't connected yet. Your address wasn't stored."
      />
    </form>
  );
}

const TOPICS = ["Order question", "Fit question", "Problem with my hat", "Return or cancellation", "Something else"];

/** Contact form. Validates in the browser and on the server; delivers only to CONTACT_FORM_ENDPOINT. */
export function ContactForm({ configured, supportEmail }: { configured: boolean; supportEmail: string | null }) {
  const [state, action, pending] = useActionState(contactAction, idle);
  const uid = useId();
  const errors = state.status === "invalid" ? state.errors : {};
  const values = state.status === "invalid" ? state.values : {};
  const errorCount = Object.keys(errors).length;
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errorCount) summaryRef.current?.focus();
  }, [state, errorCount]);

  const fieldProps = (name: string) => ({
    id: `${uid}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-error` : undefined,
    defaultValue: values[name],
  });
  const fieldError = (name: string) =>
    errors[name] ? (
      <p id={`${uid}-${name}-error`} className="mt-1.5 text-sm font-medium text-alert">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form action={action} noValidate className="space-y-5">
      {!configured && (
        <p className="notice">
          <strong>This form isn&apos;t connected yet.</strong> Messages are validated but not sent or stored.
          {supportEmail ? (
            <>
              {" "}
              Email us at{" "}
              <a className="link" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
              .
            </>
          ) : (
            " A support address will be added before launch."
          )}
        </p>
      )}
      {errorCount > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="border-l-[3px] border-alert bg-alert-tint p-3 text-sm outline-none">
          <p className="font-semibold">Please fix {errorCount === 1 ? "1 field" : `${errorCount} fields`}:</p>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(errors).map(([name, msg]) => (
              <li key={name}>
                <a className="link" href={`#${uid}-${name}`}>
                  {msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className="text-sm font-semibold">
            Name
          </label>
          <input {...fieldProps("name")} type="text" autoComplete="name" required className="field mt-1.5" />
          {fieldError("name")}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="text-sm font-semibold">
            Email
          </label>
          <input {...fieldProps("email")} type="email" autoComplete="email" inputMode="email" required className="field mt-1.5" />
          {fieldError("email")}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-topic`} className="text-sm font-semibold">
            Topic
          </label>
          <select {...fieldProps("topic")} className="field mt-1.5">
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-order`} className="text-sm font-semibold">
            Order number <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input {...fieldProps("order")} type="text" className="field mt-1.5" />
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-message`} className="text-sm font-semibold">
          Message
        </label>
        <textarea {...fieldProps("message")} rows={6} required className="field mt-1.5 resize-y" />
        {fieldError("message")}
      </div>
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          Company <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending} aria-busy={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
      <StatusMessage state={state} unconfiguredText="Not sent: this form isn't connected yet, so your message wasn't delivered or stored." />
    </form>
  );
}
