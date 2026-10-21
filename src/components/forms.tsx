"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { contactSchema } from "@/lib/validation";
export function Newsletter({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState("");
  return (
    <section
      className={`newsletter ${compact ? "newsletter-compact" : ""}`}
      id="newsletter"
    >
      <div>
        {!compact && <span className="eyebrow">A more thoughtful inbox</span>}
        <h2>
          {compact ? "A more thoughtful inbox." : "Good finds. No noise."}
        </h2>
        <p>
          New guides and considered discoveries, when there’s something worth
          sharing.
        </p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const fd = new FormData(e.currentTarget);
          try {
            const r = await fetch("/api/forms/newsletter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: fd.get("email"),
                consent: fd.get("consent") === "on",
                website: fd.get("website"),
              }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error);
            setSuccess(true);
            setUnsubscribe(data.unsubscribeUrl || "");
            toast.success("Your subscription preference has been recorded.");
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Please try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {success ? (
          <div className="success" role="status">
            <Check />
            Thanks. Your preference has been recorded.
            {unsubscribe && (
              <a href={unsubscribe}>Save your unsubscribe link</a>
            )}
            <small>Email delivery is not configured yet.</small>
          </div>
        ) : (
          <>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <div className="input-button">
              <input
                required
                id="newsletter-email"
                name="email"
                type="email"
                placeholder="Your email address"
                maxLength={254}
              />
              <button disabled={busy} aria-label="Subscribe">
                {busy ? (
                  "Joining…"
                ) : compact ? (
                  "Subscribe"
                ) : (
                  <ArrowRight size={21} />
                )}
              </button>
            </div>
            <input
              className="honeypot"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <label className="check-label">
              <input name="consent" type="checkbox" required />I agree to
              receive editorial emails. Unsubscribe anytime.
            </label>
            <small>
              Read our <Link href="/privacy-policy">privacy policy</Link>. No
              email is sent during setup.
            </small>
          </>
        )}
      </form>
    </section>
  );
}
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
  });
  if (sent)
    return (
      <div className="empty" role="status">
        <Check />
        <h3>Message received.</h3>
        <p>
          Your message has been saved to our inbox. Email notifications are not
          enabled during setup.
        </p>
        <button className="button secondary" onClick={() => setSent(false)}>
          Send another message
        </button>
      </div>
    );
  return (
    <form
      className="form-stack"
      onSubmit={handleSubmit(async (values) => {
        try {
          const r = await fetch("/api/forms/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error);
          setSent(true);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Unable to send.");
        }
      })}
    >
      {(["name", "email", "subject", "message"] as const).map((name) => (
        <div className="form-field" key={name}>
          <label htmlFor={`contact-${name}`}>
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </label>
          {name === "message" ? (
            <textarea
              id={`contact-${name}`}
              rows={6}
              required
              minLength={20}
              maxLength={5000}
              {...register(name)}
              aria-invalid={!!errors[name]}
              aria-describedby={
                errors[name] ? `contact-${name}-error` : undefined
              }
            />
          ) : (
            <input
              id={`contact-${name}`}
              type={name === "email" ? "email" : "text"}
              required
              autoComplete={
                name === "name"
                  ? "name"
                  : name === "email"
                    ? "email"
                    : undefined
              }
              minLength={
                name === "name" ? 2 : name === "subject" ? 3 : undefined
              }
              maxLength={name === "name" ? 100 : name === "subject" ? 150 : 254}
              {...register(name)}
              aria-invalid={!!errors[name]}
              aria-describedby={
                errors[name] ? `contact-${name}-error` : undefined
              }
            />
          )}
          <small
            className="field-error"
            id={`contact-${name}-error`}
            aria-live="polite"
          >
            {errors[name]?.message}
          </small>
        </div>
      ))}
      <input
        className="honeypot"
        {...register("website")}
        tabIndex={-1}
        aria-hidden="true"
      />
      <p className="muted">
        Your details are used to respond to this message. See our{" "}
        <Link href="/privacy-policy">privacy policy</Link>.
      </p>
      <button className="button" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
