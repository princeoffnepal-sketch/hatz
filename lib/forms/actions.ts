"use server";
import { allowRequest } from "@/lib/abuse.server";
import { database, databaseConfigured, runtime } from "@/lib/admin/db.server";

/** Forms persist to the private inbox, or forward to a configured provider. */

export type FormState =
  | { status: "idle" }
  | { status: "invalid"; errors: Record<string, string>; values: Record<string, string>; at: number }
  | { status: "unconfigured"; at: number }
  | { status: "error"; message: string; at: number }
  | { status: "sent"; message: string; at: number };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function forward(endpoint: string, payload: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const at = Date.now();
  // Honeypot: real people leave this empty.
  if (field(formData, "company", 200)) return { status: "error", message: "Your message couldn't be sent.", at };

  const values = {
    name: field(formData, "name", 120),
    email: field(formData, "email", 200),
    topic: field(formData, "topic", 60),
    order: field(formData, "order", 60),
    message: field(formData, "message", 4000),
  };
  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "Enter your name.";
  if (!EMAIL.test(values.email)) errors.email = "Enter an email address like name@example.com.";
  if (values.message.length < 10) errors.message = "Tell us a little more (at least 10 characters).";
  if (Object.keys(errors).length) return { status: "invalid", errors, values, at };

  try { if (!await allowRequest("contact",5,3600)) return {status:"error",message:"Please try again later or email exclusivehatzz@gmail.com.",at}; } catch { return {status:"error",message:"Please email exclusivehatzz@gmail.com while our form is unavailable.",at}; }
  const endpoint = runtime("CONTACT_FORM_ENDPOINT");
  if (!endpoint) {
    if (!databaseConfigured()) return { status: "unconfigured", at };
    try {await database().prepare("INSERT INTO submissions(id,kind,name,email,topic,message,created) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),"contact",values.name,values.email,values.topic,[values.order ? `Order: ${values.order}` : "",values.message].filter(Boolean).join("\n"),Math.floor(at/1000)).run();return {status:"sent",message:"Your message has been saved to our support inbox.",at};}catch{return {status:"error",message:"Your message could not be saved. Please try again.",at};}
  }

  return (await forward(endpoint, values))
    ? { status: "sent", message: "Thanks. Your message was delivered to our support inbox.", at }
    : { status: "error", message: "Your message couldn't be delivered. Please try again later.", at };
}
