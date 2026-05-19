"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, CheckCircle2, Clock, Compass, MapPin, RotateCcw, Shield, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * About page — English (and non-ko locales).
 * Mirrors the Korean about-landing structure but with concise English copy
 * suitable for first-time international visitors.
 */

function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      {children}
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-primary text-[11px] font-semibold tracking-[0.18em] uppercase">
      {children}
    </p>
  );
}

export function AboutLandingEn() {
  return (
    <div className="bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* HERO */}
      <Section className="bg-[var(--text-strong)]">
        <div className="page-container max-w-5xl px-4 py-20 sm:px-6 sm:py-24 md:py-28">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/52">
            Seoul · Local routes · Service
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.05]">
            What is haru?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/78">
            Pick a great day, then follow it.<br />
            That&apos;s the whole service.
          </p>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-white/58">
            Routes built by locals so Seoul feels easier to move through, even on day one.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/posts"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-md transition-all hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass className="size-4" strokeWidth={1.75} aria-hidden />
              Browse haruways
              <ArrowRight className="size-3.5 opacity-70" aria-hidden />
            </Link>
            <Link
              href="/guardians"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/28 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/16 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Users className="size-4" strokeWidth={1.75} aria-hidden />
              Meet the haruee
            </Link>
          </div>
        </div>
      </Section>

      {/* WHY HARU */}
      <Section className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <Kicker>Why haru</Kicker>
        <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          Less searching, more being there.
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
          We replace endless tab-hopping with a single, curated day. You don&apos;t need to plan from scratch — pick the day that fits your mood and the route is already there.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Curated, not crowd-sourced",
              body: "Routes are made by people who actually live near each stop — not aggregated reviews.",
            },
            {
              title: "Follow without planning",
              body: "Spots, order, timing, and reasons are bundled. You just walk it.",
            },
            {
              title: "A real local on standby",
              body: "Need a tweak? Ask a haruee — quick replies in chat, optional in-person companion.",
            },
          ].map(({ title, body }) => (
            <li key={title} className="rounded-2xl border border-border/50 bg-card/60 p-5">
              <h3 className="text-text-strong text-base font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* WHAT IS HARUWAY */}
      <Section className="border-border/50 border-y bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="grid items-start gap-10 md:grid-cols-[1fr_1.2fr]">
            <div>
              <Kicker>What is a haruway?</Kicker>
              <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                A day-sized route, built by a haruee.
              </h2>
              <p className="text-muted-foreground mt-4 text-base leading-relaxed">
                A haruway is more than a list of places.<br />
                It bundles spots, movement order, timing, and why each one is here — a day you can simply follow.
              </p>
              <Link
                href="/posts"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-trust-blue)] transition-colors hover:opacity-80"
              >
                Browse haruways
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ul className="flex flex-col gap-4">
              {[
                { icon: MapPin, label: "Spots", desc: "Hand-picked places worth your time." },
                { icon: ArrowRight, label: "Movement order", desc: "Routing that flows naturally between stops." },
                { icon: Clock, label: "Estimated timing", desc: "See how your day stacks up at a glance." },
                { icon: Star, label: "Why this spot", desc: "Each pick comes with a short reason." },
                { icon: RotateCcw, label: "Backup options", desc: "Alternatives when weather or crowd shifts." },
              ].map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-start gap-4">
                  <span className="bg-primary/8 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <p className="text-text-strong text-sm font-semibold">{label}</p>
                    <p className="text-muted-foreground mt-0.5 text-[13px] leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* WHAT IS HARUEE */}
      <Section className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <Kicker>What is a haruee?</Kicker>
        <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          Those who open your day.
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
          A haruee is a Seoul local who designs and offers days you can walk. They build routes based on the neighborhoods and styles they know best, so you get something a traveler can actually follow.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/guardians"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-90 hover:scale-[1.02]"
          >
            <Users className="size-4" strokeWidth={1.75} aria-hidden />
            Meet the haruee
          </Link>
          <Link
            href="/guardians/apply"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-strong)] transition-all hover:bg-muted hover:scale-[1.02]"
          >
            Become a haruee
            <ArrowRight className="size-3.5 opacity-60" aria-hidden />
          </Link>
        </div>
      </Section>

      {/* HOW TO START */}
      <Section className="border-border/50 border-t bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <Kicker>How to start</Kicker>
          <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Three steps to your Seoul day.
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Pick a haruway",
                body: "Browse by mood, area, or theme. Open the route and skim it first.",
              },
              {
                num: "02",
                title: "Check the haruee",
                body: "Read their style, language, and reviews. Send a quick question if you want.",
              },
              {
                num: "03",
                title: "Just walk",
                body: "Follow the order. The haruee is on chat if anything shifts on the day.",
              },
            ].map(({ num, title, body }) => (
              <li key={num} className="rounded-2xl border border-border/50 bg-card/60 p-6">
                <p className="text-primary text-xs font-bold tracking-[0.18em]">{num}</p>
                <h3 className="text-text-strong mt-3 text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* PRICING TEASER */}
      <Section id="pricing" className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <Kicker>Pricing</Kicker>
        <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          Browse free. Pay only when you go deeper.
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
          You can explore haruways and read summaries at no cost. Unlock a full step-by-step guide per route, or request a haruee for tailored help — both are pay-as-you-go.
        </p>
        <div className="mt-8">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-trust-blue)] transition-colors hover:opacity-80"
          >
            See pricing details
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Section>

      {/* TRUST & SCOPE */}
      <Section className="border-border/50 border-t bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <Kicker>Trust & scope</Kicker>
          <h2 className="text-text-strong mt-3 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Companion support — not medical, legal, or emergency services.
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Shield, body: "Haruee profiles are reviewed before going public." },
              { icon: CheckCircle2, body: "Language proficiency is self-declared and visible up front." },
              { icon: Star, body: "Reviews come from travelers who actually completed sessions." },
              { icon: RotateCcw, body: "Cancellations and refunds follow per-tier policy (see Pricing)." },
            ].map(({ icon: Icon, body }, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-[var(--text-strong)]">
        <div className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
            Your day in Seoul, your kind of route.
          </h2>
          <p className="mt-4 text-base text-white/72">Pick a haruway. Meet a haruee. Just walk.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/posts"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-md transition-all hover:bg-white/95 hover:scale-[1.02]"
            >
              <Compass className="size-4" strokeWidth={1.75} aria-hidden />
              Browse haruways
            </Link>
            <Link
              href="/guardians"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/28 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/16 hover:scale-[1.02]"
            >
              <Users className="size-4" strokeWidth={1.75} aria-hidden />
              Meet the haruee
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
