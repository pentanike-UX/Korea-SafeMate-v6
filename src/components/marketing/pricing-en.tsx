"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, MessageCircle, Compass, Sparkles } from "lucide-react";

/**
 * Pricing page — English (non-ko) compressed version.
 * Mirrors cashflow structure: free to browse, pay-as-you-go for unlocks and personalized help.
 */
export function PricingEn() {
  return (
    <div className="bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* HERO */}
      <section className="border-b border-border/40 bg-[var(--text-strong)]">
        <div className="page-container max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/52">Pricing</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Browse free.<br />Pay only when you go deeper.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/72">
            Browsing haruways and summaries is always free. You pay when you unlock a full step-by-step route, or when you book personalized help from a haruee.
          </p>
        </div>
      </section>

      {/* TIERS */}
      <section className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {/* Free */}
          <article className="flex flex-col rounded-3xl border border-border/50 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Compass className="size-4" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Free</p>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Browse</h2>
            <p className="mt-1 text-sm text-muted-foreground">Discover routes and read summaries.</p>
            <p className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">₩0</p>
            <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
              {[
                "Search haruways by area and mood",
                "Read summaries and reviews",
                "Save guides for later",
                "Check haruee profiles and languages",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/posts"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted/50"
            >
              Browse haruways
              <ArrowRight className="size-4" />
            </Link>
          </article>

          {/* Per-unlock — Highlighted */}
          <article className="relative flex flex-col rounded-3xl border-2 border-[var(--brand-primary)] bg-card p-6 shadow-md">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-on-brand)]">
              Most popular
            </span>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                <Sparkles className="size-4" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Per haruway</p>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Unlock a route</h2>
            <p className="mt-1 text-sm text-muted-foreground">Full step-by-step guide for one haruway.</p>
            <p className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">₩29,000</p>
            <p className="text-xs text-muted-foreground">per haruway · one-time</p>
            <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
              {[
                "Real venue names and addresses",
                "Photo tips and on-site notes",
                "Movement info between spots",
                "Save & offline access",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/posts"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-95 hover:scale-[1.01]"
            >
              See haruways
              <ArrowRight className="size-4" />
            </Link>
          </article>

          {/* Custom */}
          <article className="flex flex-col rounded-3xl border border-border/50 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <MessageCircle className="size-4" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Custom</p>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Tailored request</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ask a haruee for a personalized day.</p>
            <p className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">Quote</p>
            <p className="text-xs text-muted-foreground">priced per haruee, party size, scope</p>
            <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
              {[
                "1:1 consult with a haruee",
                "Replies within ~24 hours",
                "One revision included",
                "Optional in-person companion (extra)",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/guardians"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted/50"
            >
              Find a haruee
              <ArrowRight className="size-4" />
            </Link>
          </article>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/40 bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Pricing FAQ
          </h2>
          <dl className="mt-8 divide-y divide-border/40">
            {[
              {
                q: "Can I preview a haruway before paying?",
                a: "Yes. Summary, hero image, and a one-line tip are always free. Only the full step-by-step guide requires unlock.",
              },
              {
                q: "Do I pay per route or per haruee?",
                a: "Per route for unlock (₩29,000 one-time). When you book a haruee for tailored help, pricing is set per request.",
              },
              {
                q: "What if I'm not satisfied?",
                a: "We follow per-tier refund policy. If a haruee can't deliver the booked session, you get a full refund.",
              },
              {
                q: "Is there a subscription?",
                a: "No. Everything is pay-as-you-go so you only pay for what you actually use.",
              },
            ].map((item) => (
              <div key={item.q} className="py-5">
                <dt className="text-sm font-semibold text-foreground">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
