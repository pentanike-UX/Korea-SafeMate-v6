"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, CheckCircle2, Users, MessageCircle, Globe } from "lucide-react";

/**
 * /guardians/apply — English compressed.
 * Application is currently Korean-language only; foreign applicants are guided
 * to email support. Keeps the page navigable from the footer without exposing
 * a Korean wall of text.
 */
export function GuardiansApplyEn() {
  return (
    <div className="bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* HERO */}
      <section className="border-b border-border/40 bg-[var(--text-strong)]">
        <div className="page-container max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/52">
            haruee application
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Become a haruee.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/72">
            haruee are Seoul locals who design routes and offer companion support within a defined scope. Applications are reviewed in 3–5 business days.
          </p>
        </div>
      </section>

      {/* WHO HARUEE ARE / NOT */}
      <section className="page-container max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-5 dark:border-emerald-700/30 dark:bg-emerald-950/15">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              haruee are
            </p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/85">
              {[
                "Seoul residents (or long-time locals)",
                "Comfortable in at least one foreign language",
                "Willing to share routes around their familiar areas",
                "Available to chat and respond within reasonable hours",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              haruee are not
            </p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/85">
              {[
                "Licensed tour guides",
                "Medical, legal, or emergency responders",
                "Drivers or chauffeurs",
                "On-call 24/7",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="mt-0.5 size-4 shrink-0 text-muted-foreground">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* APPLICATION OPTIONS */}
      <section className="border-t border-border/40 bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How to apply
          </h2>

          <ol className="mt-8 space-y-4">
            <li className="rounded-2xl border border-border/50 bg-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg font-mono text-xs font-bold">
                  KR
                </span>
                <p className="text-foreground font-semibold">Korean speakers</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Use the Korean application form — it asks about your area, language, and the kind of day you&apos;d design.
              </p>
              <Link
                href="/ko/guardians/apply"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Open Korean form
                <ArrowRight className="size-4" />
              </Link>
            </li>

            <li className="rounded-2xl border border-border/50 bg-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="bg-amber-100 text-amber-700 flex size-7 items-center justify-center rounded-lg dark:bg-amber-900/40 dark:text-amber-300">
                  <Globe className="size-3.5" />
                </span>
                <p className="text-foreground font-semibold">English speakers</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The English application form is being prepared. Meanwhile, reach out by email with your area, languages, and short intro.
              </p>
              <a
                href="mailto:hello@haru.example"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                <MessageCircle className="size-4" />
                Email us
              </a>
            </li>
          </ol>
        </div>
      </section>

      {/* CTA back */}
      <section className="page-container max-w-3xl px-4 py-16 sm:px-6 sm:py-20 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Curious what haruee actually do?
        </h2>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/guardians"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-90"
          >
            <Users className="size-4" />
            See active haruee
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
          >
            About haru
          </Link>
        </div>
      </section>
    </div>
  );
}
