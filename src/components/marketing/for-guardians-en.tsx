"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, Calendar, MapPin, TrendingUp, Users, MessageCircle } from "lucide-react";

/**
 * For-guardians (haruee recruiting) — English compressed.
 * Audience is mostly Korean locals, so this page exists primarily so foreign
 * demo viewers don't see a wall of Korean. Keep it short and direct.
 */
export function ForGuardiansEn() {
  return (
    <div className="bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* HERO */}
      <section className="border-b border-border/40 bg-[var(--text-strong)]">
        <div className="page-container max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/52">
            Now recruiting · early haruee
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.05]">
            Open someone&apos;s Seoul day.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/72">
            haruee are Seoul locals who design day-sized routes — sharing the neighborhoods they actually know with travelers from around the world.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/guardians/apply"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-md transition-all hover:bg-white/95 hover:scale-[1.02]"
            >
              Apply to be a haruee
              <ArrowRight className="size-3.5 opacity-70" />
            </Link>
            <Link
              href="/guardians"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/28 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/16 hover:scale-[1.02]"
            >
              <Users className="size-4" />
              See active haruee
            </Link>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Why join haru
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Set your own pace. Build routes around what you already love. Earn from haruway unlocks and tailored requests — pay-as-you-go, no monthly quota.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Calendar,
              title: "Your schedule",
              body: "Open availability when it fits. Pause anytime — no penalty.",
            },
            {
              icon: MapPin,
              title: "Your neighborhood",
              body: "Lead routes only in the areas and themes you actually know.",
            },
            {
              icon: TrendingUp,
              title: "Pay-as-you-go income",
              body: "Earn per haruway unlock and per tailored request. Settled monthly.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-2xl border border-border/50 bg-card/60 p-5">
              <span className="bg-primary/8 text-primary mb-3 flex size-9 items-center justify-center rounded-lg">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
              <h3 className="text-text-strong text-base font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border/40 bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How haruee work
          </h2>
          <ol className="mt-8 space-y-4">
            {[
              { n: "01", title: "Apply", body: "Tell us your area, language, and what kind of day you want to design." },
              { n: "02", title: "Review", body: "We confirm your profile and check fit. Usually 3–5 business days." },
              { n: "03", title: "Build haruways", body: "Publish routes with spots, timing, and reasons. We help with format." },
              { n: "04", title: "Get requests", body: "Travelers chat first; you decide which requests to accept." },
              { n: "05", title: "Earn", body: "Get paid per unlock and per tailored request, monthly settlement." },
            ].map(({ n, title, body }) => (
              <li key={n} className="flex items-start gap-5 rounded-2xl border border-border/50 bg-card p-4">
                <span className="text-primary shrink-0 font-mono text-sm font-bold">{n}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground font-semibold">{title}</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="page-container max-w-3xl px-4 py-20 sm:px-6 sm:py-24 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Ready to open a Seoul day?
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md text-base leading-relaxed">
          Apply takes about 10 minutes. We&apos;ll get back within 3–5 business days.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/guardians/apply"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-90 hover:scale-[1.02]"
          >
            <MessageCircle className="size-4" />
            Start application
          </Link>
        </div>
      </section>
    </div>
  );
}
