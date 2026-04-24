"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { ContentPost, ContentPostHeroSubject } from "@/types/domain";
import { applyStructuredPatch, buildFullStructuredFromParts } from "@/lib/post-ai-meta-apply";
import { canRequestAiMetaSuggestion } from "@/lib/post-ai-meta-eligibility";
import { fetchPostMetaAiSuggestion } from "@/lib/post-ai-meta-mock";
import type { PostMetaAiSuggestionDraft, PostMetaTagCategory } from "@/lib/post-ai-meta-types";
import { ALL_META_TAG_IDS, labelMetaTag } from "@/lib/post-ai-meta-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, X } from "lucide-react";

const COPY = {
  stepLabel: "4. AI 메타 추천",
  stepHint: "초안이 갖춰지면 분석을 실행할 수 있어요. AI는 제안만 하며, 적용은 가디언이 결정합니다.",
  gatePrefix: "버튼 활성 조건: ",
  ctaFetch: "AI 추천 받기",
  ctaRefetch: "다시 분석하기",
  applyAll: "전체 적용",
  resetSection: "추천안으로 되돌리기",
  applyAudience: "여행자 태그 적용",
  applySchedule: "일정·이동 적용",
  applyMood: "무드 태그 적용",
  applyCopy: "카드 문구 적용",
  applyHero: "히어로 메타 적용",
  sectionAudience: "이 포스트를 보면 좋은 여행자",
  sectionSchedule: "일정과 이동 성격",
  sectionMood: "분위기와 테마",
  sectionCard: "카드용 짧은 요약",
  sectionReason: "추천 이유 한 줄",
  sectionBest: "이럴 때 좋아요 (맥락)",
  sectionHero: "이미지 표현 메타 (히어로)",
  sectionWhy: "AI가 이렇게 판단했어요",
  addTag: "태그 추가",
  pickOption: "추천안",
  custom: "직접 입력",
  heroPerson: "인물 중심",
  heroPlace: "장소·풍경",
  heroMixed: "혼합",
  currentApplied: "포스트에 적용된 메타",
  noneApplied: "아직 구조화 메타가 비어 있어요.",
} as const;

type TextPick =
  | { source: "option"; index: number }
  | { source: "custom"; text: string };

function resolveTextPick(pick: TextPick, options: string[]): string {
  if (pick.source === "custom") return pick.text;
  const o = options[pick.index];
  return o ?? options[0] ?? "";
}

function initPick(options: string[]): TextPick {
  return options.length ? { source: "option", index: 0 } : { source: "custom", text: "" };
}

function ChipRow({
  items,
  onRemove,
  pool,
  onAdd,
}: {
  items: string[];
  onRemove: (id: string) => void;
  pool: readonly string[];
  onAdd: (id: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const listId = useId();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {items.map((id) => (
          <Badge key={id} variant="secondary" className="gap-1 rounded-full py-1 pr-1 pl-2 font-medium">
            {labelMetaTag(id)}
            <button
              type="button"
              className="hover:bg-muted rounded-full p-0.5"
              onClick={() => onRemove(id)}
              aria-label={`${id} 제거`}
            >
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={COPY.addTag}
          className="max-w-[200px] rounded-xl text-sm"
          list={listId}
        />
        <datalist id={listId}>
          {pool.map((id) => (
            <option key={id} value={id}>
              {labelMetaTag(id)}
            </option>
          ))}
        </datalist>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            const id = raw.trim();
            if (!id || items.includes(id)) return;
            onAdd(id);
            setRaw("");
          }}
        >
          {COPY.addTag}
        </Button>
      </div>
    </div>
  );
}

export function GuardianPostAiMetaPanel({ post, onApply }: { post: ContentPost; onApply: (next: ContentPost) => void }) {
  const gate = useMemo(() => canRequestAiMetaSuggestion(post), [post]);
  const applied = post.route_journey?.structured_exposure_meta;

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<PostMetaAiSuggestionDraft | null>(null);

  const [audience, setAudience] = useState<string[]>([]);
  const [duration, setDuration] = useState<string[]>([]);
  const [mobility, setMobility] = useState<string[]>([]);
  const [mood, setMood] = useState<string[]>([]);
  const [summaryPick, setSummaryPick] = useState<TextPick>({ source: "custom", text: "" });
  const [reasonPick, setReasonPick] = useState<TextPick>({ source: "custom", text: "" });
  const [bestPick, setBestPick] = useState<TextPick>({ source: "custom", text: "" });
  const [heroSubject, setHeroSubject] = useState<ContentPostHeroSubject>("mixed");

  const hydrateFromDraft = useCallback((d: PostMetaAiSuggestionDraft) => {
    setAudience([...d.audience_tags_suggested]);
    setDuration([...d.duration_tags_suggested]);
    setMobility([...d.mobility_tags_suggested]);
    setMood([...d.mood_tags_suggested]);
    setSummaryPick(initPick(d.summary_card_suggested));
    setReasonPick(initPick(d.reason_line_suggested));
    setBestPick(initPick(d.best_for_context_suggested));
    setHeroSubject(d.hero_subject_suggested);
  }, []);

  const runFetch = useCallback(async () => {
    if (!gate.ok) return;
    setLoading(true);
    try {
      const next = await fetchPostMetaAiSuggestion(post);
      setDraft(next);
      hydrateFromDraft(next);
    } finally {
      setLoading(false);
    }
  }, [gate.ok, post, hydrateFromDraft]);

  const summaryOpts = draft?.summary_card_suggested ?? [];
  const reasonOpts = draft?.reason_line_suggested ?? [];
  const bestOpts = draft?.best_for_context_suggested ?? [];

  const resolvedSummary = resolveTextPick(summaryPick, summaryOpts);
  const resolvedReason = resolveTextPick(reasonPick, reasonOpts);
  const resolvedBest = resolveTextPick(bestPick, bestOpts);

  const applyFull = () => {
    const structured = buildFullStructuredFromParts({
      audience_tags: audience,
      duration_tags: duration,
      mobility_tags: mobility,
      mood_tags: mood,
      summary_card: resolvedSummary,
      reason_line: resolvedReason,
      best_for_context: resolvedBest,
    });
    onApply(
      applyStructuredPatch(post, structured, heroSubject),
    );
  };

  const tagHelpers = (cat: PostMetaTagCategory, items: string[], setItems: (v: string[]) => void) => ({
    remove: (id: string) => setItems(items.filter((x) => x !== id)),
    add: (id: string) => setItems(items.includes(id) ? items : [...items, id]),
    reset: () => {
      if (!draft) return;
      const key =
        cat === "audience"
          ? draft.audience_tags_suggested
          : cat === "duration"
            ? draft.duration_tags_suggested
            : cat === "mobility"
              ? draft.mobility_tags_suggested
              : draft.mood_tags_suggested;
      setItems([...key]);
    },
    applySection: () => {
      const patch =
        cat === "audience"
          ? { audience_tags: items }
          : cat === "duration"
            ? { duration_tags: items }
            : cat === "mobility"
              ? { mobility_tags: items }
              : { mood_tags: items };
      onApply(applyStructuredPatch(post, patch));
    },
  });

  const applyCardTexts = () => {
    onApply(
      applyStructuredPatch(post, {
        summary_card: resolvedSummary,
        reason_line: resolvedReason,
        best_for_context: resolvedBest,
      }),
    );
  };

  const applyHeroOnly = () => {
    onApply(applyStructuredPatch(post, {}, heroSubject));
  };

  return (
    <Card className="border-primary/25 rounded-2xl border bg-gradient-to-b from-primary/5 to-transparent shadow-[var(--shadow-sm)]">
      <CardHeader className="space-y-1 pb-2">
        <p className="text-primary flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          {COPY.stepLabel}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">{COPY.stepHint}</p>
        {!gate.ok ? (
          <p className="text-muted-foreground border-border/60 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
            {COPY.gatePrefix}
            {gate.hint}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="rounded-xl gap-2"
            disabled={!gate.ok || loading}
            onClick={() => void runFetch()}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {draft ? COPY.ctaRefetch : COPY.ctaFetch}
          </Button>
          {draft ? (
            <Button type="button" variant="default" className="rounded-xl" onClick={applyFull}>
              {COPY.applyAll}
            </Button>
          ) : null}
        </div>

        {applied && (applied.audience_tags.length > 0 || applied.summary_card) ? (
          <div className="border-border/50 rounded-xl border bg-card/80 px-3 py-2 text-xs">
            <p className="text-muted-foreground font-semibold">{COPY.currentApplied}</p>
            <p className="text-foreground mt-1 line-clamp-2">
              {[
                applied.audience_tags.map(labelMetaTag).join(" · "),
                applied.summary_card,
              ]
                .filter(Boolean)
                .join(" — ")}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">{COPY.noneApplied}</p>
        )}

        {!draft ? (
          <p className="text-muted-foreground text-sm">추천을 실행하면 편집 가능한 초안이 여기에 표시됩니다.</p>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{COPY.sectionAudience}</h3>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => tagHelpers("audience", audience, setAudience).reset()}>
                    {COPY.resetSection}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" className="rounded-lg" onClick={() => tagHelpers("audience", audience, setAudience).applySection()}>
                    {COPY.applyAudience}
                  </Button>
                </div>
              </div>
              <ChipRow
                items={audience}
                onRemove={(id) => setAudience(audience.filter((x) => x !== id))}
                pool={ALL_META_TAG_IDS.audience}
                onAdd={(id) => setAudience(audience.includes(id) ? audience : [...audience, id])}
              />
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{COPY.sectionSchedule}</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => {
                      if (!draft) return;
                      setDuration([...draft.duration_tags_suggested]);
                      setMobility([...draft.mobility_tags_suggested]);
                    }}
                  >
                    {COPY.resetSection}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="rounded-lg"
                    onClick={() => {
                      onApply(applyStructuredPatch(post, { duration_tags: duration, mobility_tags: mobility }));
                    }}
                  >
                    {COPY.applySchedule}
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-[11px] font-medium uppercase">일정</p>
              <ChipRow
                items={duration}
                onRemove={(id) => setDuration(duration.filter((x) => x !== id))}
                pool={ALL_META_TAG_IDS.duration}
                onAdd={(id) => setDuration(duration.includes(id) ? duration : [...duration, id])}
              />
              <p className="text-muted-foreground text-[11px] font-medium uppercase">이동</p>
              <ChipRow
                items={mobility}
                onRemove={(id) => setMobility(mobility.filter((x) => x !== id))}
                pool={ALL_META_TAG_IDS.mobility}
                onAdd={(id) => setMobility(mobility.includes(id) ? mobility : [...mobility, id])}
              />
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{COPY.sectionMood}</h3>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => tagHelpers("mood", mood, setMood).reset()}>
                    {COPY.resetSection}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" className="rounded-lg" onClick={() => tagHelpers("mood", mood, setMood).applySection()}>
                    {COPY.applyMood}
                  </Button>
                </div>
              </div>
              <ChipRow
                items={mood}
                onRemove={(id) => setMood(mood.filter((x) => x !== id))}
                pool={ALL_META_TAG_IDS.mood}
                onAdd={(id) => setMood(mood.includes(id) ? mood : [...mood, id])}
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">{COPY.sectionCard}</h3>
              <div className="space-y-2">
                <Label className="text-xs">{COPY.pickOption}</Label>
                <div className="flex flex-col gap-2">
                  {summaryOpts.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSummaryPick({ source: "option", index: i })}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                        summaryPick.source === "option" && summaryPick.index === i
                          ? "border-primary bg-primary/10"
                          : "border-border/60 hover:bg-muted/40",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{COPY.custom}</Label>
                <Textarea
                  value={summaryPick.source === "custom" ? summaryPick.text : ""}
                  onChange={(e) => setSummaryPick({ source: "custom", text: e.target.value })}
                  className="rounded-xl text-sm"
                  rows={2}
                  placeholder="카드에 쓸 한 줄 요약"
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">{COPY.sectionReason}</h3>
              <div className="flex flex-col gap-2">
                {reasonOpts.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReasonPick({ source: "option", index: i })}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                      reasonPick.source === "option" && reasonPick.index === i
                        ? "border-primary bg-primary/10"
                        : "border-border/60 hover:bg-muted/40",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Textarea
                value={reasonPick.source === "custom" ? reasonPick.text : ""}
                onChange={(e) => setReasonPick({ source: "custom", text: e.target.value })}
                className="rounded-xl text-sm"
                rows={2}
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">{COPY.sectionBest}</h3>
              <div className="flex flex-col gap-2">
                {bestOpts.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBestPick({ source: "option", index: i })}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                      bestPick.source === "option" && bestPick.index === i
                        ? "border-primary bg-primary/10"
                        : "border-border/60 hover:bg-muted/40",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Textarea
                value={bestPick.source === "custom" ? bestPick.text : ""}
                onChange={(e) => setBestPick({ source: "custom", text: e.target.value })}
                className="rounded-xl text-sm"
                rows={2}
              />
              <Button type="button" size="sm" variant="secondary" className="rounded-lg" onClick={applyCardTexts}>
                {COPY.applyCopy}
              </Button>
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{COPY.sectionHero}</h3>
                <Button type="button" size="sm" variant="secondary" className="rounded-lg" onClick={applyHeroOnly}>
                  {COPY.applyHero}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["person", COPY.heroPerson],
                    ["place", COPY.heroPlace],
                    ["mixed", COPY.heroMixed],
                  ] as const
                ).map(([v, lab]) => (
                  <Button
                    key={v}
                    type="button"
                    size="sm"
                    variant={heroSubject === v ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setHeroSubject(v)}
                  >
                    {lab}
                  </Button>
                ))}
              </div>
            </section>

            <section className="border-border/50 space-y-2 rounded-xl border bg-muted/15 p-4">
              <h3 className="text-sm font-semibold">{COPY.sectionWhy}</h3>
              <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs leading-relaxed">
                {draft.why_suggested.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
