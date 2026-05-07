"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ContentPost,
  ContentPostFormat,
  ContentPostHeroSubject,
  ContentPostKind,
  PostStructuredContentV1,
  RouteJourney,
  RoutePostStructuredContentV1,
  RouteSpot,
} from "@/types/domain";
import { POST_STRUCTURED_CONTENT_VERSION } from "@/types/domain";
import { inferRouteStructuredDraftFromPost, serializeRoutePostToShellBody } from "@/lib/post-structured-content";
import { saveGuardianRoutePostAction } from "@/app/[locale]/(authed)/guardian/posts/actions";
import { signGuardianPostPreviewTokenAction } from "@/app/[locale]/(authed)/guardian/posts/preview-token-action";
import { GUARDIAN_WORKSPACE } from "@/lib/mypage/guardian-workspace-routes";
import type { GuardianPostSavePayload } from "@/lib/guardian-posts-api";
import { isUuidString } from "@/lib/guardian-posts-api";
import { RouteMapPreview } from "@/components/maps/route-map-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockSeoulSearchPlaces } from "@/data/mock/guardian-mock-places";
import { GuardianPostAiMetaPanel } from "@/components/guardian/guardian-post-ai-meta-panel";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Copy, Loader2, MapPin, Star, Trash2 } from "lucide-react";

function buildSavePayload(
  p: ContentPost,
  routeDraft: RoutePostStructuredContentV1,
  status: ContentPost["status"],
): GuardianPostSavePayload | null {
  if (!p.route_journey) return null;
  const body = serializeRoutePostToShellBody(routeDraft, p.route_journey.spots.length);
  const structured_content: PostStructuredContentV1 = {
    version: POST_STRUCTURED_CONTENT_VERSION,
    template: "route_post",
    data: routeDraft,
  };
  return {
    author_user_id: p.author_user_id,
    region_slug: p.region_slug,
    category_slug: p.category_slug,
    kind: p.kind,
    title: p.title,
    summary: p.summary,
    body,
    tags: p.tags,
    status,
    post_format: p.post_format,
    cover_image_url: p.cover_image_url ?? null,
    hero_subject: p.hero_subject ?? null,
    route_journey: p.route_journey,
    route_highlights: p.route_highlights ?? [],
    structured_content,
  };
}

function pathFromSpots(spots: RouteSpot[]) {
  const sorted = [...spots].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return [];
  if (sorted.length === 1) return [{ lat: sorted[0].lat, lng: sorted[0].lng }];
  const out: { lat: number; lng: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push({ lat: sorted[i].lat, lng: sorted[i].lng });
    if (i < sorted.length - 1) {
      const n = sorted[i + 1];
      out.push({ lat: (sorted[i].lat + n.lat) / 2, lng: (sorted[i].lng + n.lng) / 2 });
    }
  }
  return out;
}

function newSpot(order: number, lat = 37.5665, lng = 126.978): RouteSpot {
  return {
    id: `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    order,
    title: "",
    place_name: "",
    short_description: "",
    body: "",
    image_urls: [],
    recommend_reason: "",
    stay_duration_minutes: 20,
    photo_tip: "",
    caution: "",
    lat,
    lng,
    featured: false,
  };
}

const COPY = {
  typeTitle: "어떤 형태로 소개할까요?",
  typeSpot: "스팟",
  typeRoute: "루트",
  typeHybrid: "하이브리드 (추천)",
  typeHint: "v2에서는 하이브리드가 가장 설득력 있는 기본 포맷입니다.",
  basicTitle: "기본 정보",
  title: "제목",
  summary: "한 줄 요약",
  tags: "태그 (쉼표로 구분)",
  metaTitle: "이 여정의 기본 정보를 입력해주세요",
  transport: "이동 방식",
  duration: "예상 총 소요(분)",
  distance: "예상 총 거리(km)",
  timeOfDay: "추천 시간대",
  difficulty: "난이도",
  travelerTypes: "추천 여행자 유형 (쉼표로 구분)",
  night: "야간 친화",
  spotEditorTitle: "스팟별 내용을 채워주세요",
  spotSearchLead:
    "장소명·주소로 검색해 스팟을 빠르게 추가하세요. 검색이 어려운 지점만 아래 「지도에서 직접 선택」으로 보조 추가할 수 있어요.",
  searchLabel: "장소·주소 검색",
  searchPlaceholder: "장소명, 주소, 카페명, 명소명을 입력하세요",
  mapAddSecondary: "지도에서 직접 선택 (보조)",
  mapPickBanner: "지도의 빈 곳을 탭하면 새 스팟이 추가됩니다. (검색으로 찾기 어려운 포인트용)",
  mapAddSectionLabel: "보조 옵션",
  selectedLocation: "선택된 위치",
  locationPinned: "지도에 핀이 표시되어 있습니다. 검색으로 다시 고르거나 보조 모드에서 지도를 탭해 바꿀 수 있어요.",
  locationNeed: "위 검색으로 장소를 선택하거나, 보조 옵션에서 지도를 탭해 주세요.",
  advancedCoords: "고급: 위도·경도 직접 입력",
  advancedCoordsHide: "좌표 입력 접기",
  publish: "게시하기",
  saveDraft: "초안 저장",
  preview: "미리보기",
  savedDraft: "초안으로 저장했습니다.",
  back: "목록으로",
  mapPanelTitle: "이 가디언의 추천 여행경로",
  mapPanelHint: "핀을 눌러 스팟 선택 · 보조 「지도에서 직접 선택」 켠 뒤 빈 곳을 탭하면 스팟이 추가됩니다.",
  routeOsrm: "OSRM으로 경로 계산",
  routeOsrmHint: "도보/차량 기준 실제 도로 형상(데모 서버). 운영 시 OSRM_BASE_URL을 자체 인스턴스로 교체하세요.",
  saving: "저장 중…",
  savedPending: "검토 대기(pending)로 저장됨",
  flowStep1: "유형",
  flowStep2: "기본 정보",
  flowStep3: "본문·스팟",
  flowStep4: "AI 추천",
  flowStep5: "검토·수정",
  flowStep6: "미리보기·발행",
  structuredSectionTitle: "루트 소개 (구조형 JSON 저장)",
  structuredHint: "아래 필드가 상세 화면에 우선 표시됩니다. 저장 시 본문 문자열은 같은 내용으로 자동 생성됩니다.",
  structIntro: "이 포스트가 맞는 사람 (intro)",
  structRouteSummary: "루트 요약",
  structRouteBestFor: "이 루트가 잘 맞는 분 (선택)",
  structRouteNotes: "먼저 알고 가면 좋은 점",
  structNarrative: "본문·스팟 안내 문단",
  structClosing: "루트 마무리",
  structGuardian: "가디언 한 줄 제안",
  kindLabel: "콘텐츠 종류(kind)",
  kindHint: "실용 팁·로컬 팁을 고르면 AI 추천은 본문 팁 블록 개수 기준으로 켜집니다. 그 외는 스팟·본문 문단 기준입니다.",
  heroSubjectLabel: "히어로 이미지 초점",
  heroSubjectHint: "목록·상세 커버 크롭 기준입니다. 미선택 시 콘텐츠 종류(kind)로 자동 추론합니다.",
  heroSubjectAuto: "자동 (kind 기준)",
} as const;

const KIND_OPTIONS: { value: ContentPostKind; label: string }[] = [
  { value: "k_content", label: "K-콘텐츠" },
  { value: "practical", label: "실용 팁" },
  { value: "local_tip", label: "로컬 팁" },
  { value: "hot_place", label: "핫플" },
  { value: "food", label: "맛집·식도락" },
  { value: "shopping", label: "쇼핑" },
];

const HERO_SUBJECT_OPTIONS: { value: ContentPostHeroSubject; label: string }[] = [
  { value: "person", label: "인물 중심" },
  { value: "place", label: "장소 중심" },
  { value: "mixed", label: "혼합형" },
];

export function GuardianRoutePostEditor({
  initialPost,
  mode,
}: {
  initialPost: ContentPost;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [post, setPost] = useState<ContentPost>(initialPost);
  const [routeDraft, setRouteDraft] = useState<RoutePostStructuredContentV1>(() =>
    inferRouteStructuredDraftFromPost(initialPost),
  );
  const journey = post.route_journey!;

  const spotCountForShell = post.route_journey?.spots.length ?? 0;
  useEffect(() => {
    if (!post.route_journey) return;
    const nextBody = serializeRoutePostToShellBody(routeDraft, spotCountForShell);
    const structured_content: PostStructuredContentV1 = {
      version: POST_STRUCTURED_CONTENT_VERSION,
      template: "route_post",
      data: routeDraft,
    };
    setPost((p) => (p.route_journey ? { ...p, body: nextBody, structured_content } : p));
  }, [routeDraft, spotCountForShell, post.route_journey]);
  const [persistedPostId, setPersistedPostId] = useState<string | null>(() =>
    isUuidString(initialPost.id) ? initialPost.id : null,
  );
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(journey.spots[0]?.id ?? null);
  const [searchQ, setSearchQ] = useState("");
  const [mapPick, setMapPick] = useState(false);
  const [saving, setSaving] = useState(false);
  const [routing, setRouting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);

  const filteredPlaces = useMemo(() => {
    const s = searchQ.trim().toLowerCase();
    if (!s) return mockSeoulSearchPlaces.slice(0, 8);
    return mockSeoulSearchPlaces.filter((p) => {
      const hay = `${p.label} ${p.label_ko} ${p.district} ${p.address}`.toLowerCase();
      return hay.includes(s);
    });
  }, [searchQ]);

  const selectedSpot = journey.spots.find((x) => x.id === selectedSpotId) ?? null;

  function commitJourney(next: RouteJourney) {
    const spots = next.spots.map((s, i) => ({ ...s, order: i }));
    const path = pathFromSpots(spots);
    setPost((p) => ({
      ...p,
      route_journey: { ...next, spots, path },
    }));
  }

  function updateMeta(patch: Partial<RouteJourney["metadata"]>) {
    commitJourney({ ...journey, metadata: { ...journey.metadata, ...patch } });
  }

  function updateSpot(id: string, patch: Partial<RouteSpot>) {
    commitJourney({
      ...journey,
      spots: journey.spots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function addSpotAt(lat: number, lng: number, placeName = "", fromMap = false) {
    const spot = newSpot(journey.spots.length, lat, lng);
    if (placeName) {
      spot.place_name = placeName;
    } else if (fromMap) {
      spot.place_name = "지도에서 선택한 위치";
    }
    commitJourney({ ...journey, spots: [...journey.spots, spot] });
    setSelectedSpotId(spot.id);
  }

  function addPlaceFromSearch(place: (typeof mockSeoulSearchPlaces)[number]) {
    const spot = newSpot(journey.spots.length, place.lat, place.lng);
    spot.place_name = place.label_ko;
    spot.title = place.label_ko;
    spot.address_line = place.address;
    commitJourney({ ...journey, spots: [...journey.spots, spot] });
    setSelectedSpotId(spot.id);
    setMapPick(false);
    setSearchQ("");
  }

  function removeSpot(id: string) {
    const next = journey.spots.filter((s) => s.id !== id);
    commitJourney({ ...journey, spots: next });
    setSelectedSpotId(next[0]?.id ?? null);
  }

  function moveSpot(index: number, dir: -1 | 1) {
    const sorted = [...journey.spots].sort((a, b) => a.order - b.order);
    const j = index + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[j];
    sorted[index] = b;
    sorted[j] = a;
    commitJourney({ ...journey, spots: sorted });
  }

  function duplicateSpot(id: string) {
    const sorted = [...journey.spots].sort((a, b) => a.order - b.order);
    const src = sorted.find((s) => s.id === id);
    if (!src) return;
    const copy: RouteSpot = {
      ...src,
      id: `spot-${Date.now()}-copy`,
      title: `${src.title} (복제)`,
      featured: false,
    };
    const idx = sorted.findIndex((s) => s.id === id);
    const next = [...sorted.slice(0, idx + 1), copy, ...sorted.slice(idx + 1)];
    commitJourney({ ...journey, spots: next });
    setSelectedSpotId(copy.id);
  }

  function toggleFeatured(id: string) {
    commitJourney({
      ...journey,
      spots: journey.spots.map((s) => (s.id === id ? { ...s, featured: !s.featured } : s)),
    });
  }

  function setFormat(f: ContentPostFormat) {
    setPost((p) => {
      let next = { ...p, post_format: f };
      if (f === "spot" && p.route_journey && p.route_journey.spots.length > 1) {
        const first = [...p.route_journey.spots].sort((a, b) => a.order - b.order)[0];
        next = {
          ...next,
          route_journey: {
            ...p.route_journey,
            spots: [{ ...first, order: 0, featured: true }],
            path: pathFromSpots([{ ...first, order: 0 }]),
          },
        };
      }
      return next;
    });
  }

  async function onOpenPreview() {
    if (!persistedPostId) return;
    setPreviewBusy(true);
    setSaveError(null);
    try {
      const r = await signGuardianPostPreviewTokenAction(persistedPostId);
      if (!r.ok) {
        setSaveError(r.error);
        return;
      }
      const url = GUARDIAN_WORKSPACE.postPreview(persistedPostId, r.token);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setPreviewBusy(false);
    }
  }

  async function onSaveDraft() {
    const payload = buildSavePayload({ ...post, status: "draft" }, routeDraft, "draft");
    if (!payload) {
      setSaveError("route_journey 가 없습니다.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);
    const result = await saveGuardianRoutePostAction(payload, persistedPostId);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    if (result.saved) {
      setPersistedPostId(result.id);
      setPost((p) => ({ ...p, id: result.id, status: "draft" }));
      setSaveNotice(COPY.savedDraft);
    } else {
      setSaveNotice(result.message ?? COPY.savedDraft);
    }
  }

  async function onPublish() {
    const payload = buildSavePayload({ ...post, status: "pending" }, routeDraft, "pending");
    if (!payload) {
      setSaveError("route_journey 가 없습니다.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);
    const result = await saveGuardianRoutePostAction(payload, persistedPostId);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    if (result.saved) {
      setPersistedPostId(result.id);
      setPost((p) => ({ ...p, id: result.id, status: "pending" }));
      setSaveNotice(COPY.savedPending);
      router.push(`${GUARDIAN_WORKSPACE.posts}?saved=1`);
    } else {
      setSaveNotice(result.message ?? "Supabase 미설정: DB에 쓰지 않았습니다.");
    }
  }

  async function refreshRouteFromOsrm() {
    const sorted = [...journey.spots].sort((a, b) => a.order - b.order);
    const coordinates = sorted.map((s) => ({ lat: s.lat, lng: s.lng }));
    if (coordinates.length < 2) {
      setSaveNotice("스팟이 2곳 이상일 때 경로를 계산할 수 있습니다.");
      return;
    }
    setRouting(true);
    setSaveError(null);
    try {
      const profile = journey.metadata.transport_mode === "car" ? "car" : "foot";
      const res = await fetch("/api/routing/osrm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates, profile }),
      });
      const data = (await res.json()) as {
        error?: string;
        path?: { lat: number; lng: number }[];
        distance_m?: number;
        duration_s?: number;
      };
      if (!res.ok) {
        setSaveError(data.error ?? "경로 계산 실패");
        return;
      }
      if (!data.path?.length) {
        setSaveError("경로 좌표가 비어 있습니다.");
        return;
      }
      setPost((p) => {
        const j = p.route_journey!;
        const nextMeta = { ...j.metadata };
        if (typeof data.duration_s === "number") {
          nextMeta.estimated_total_duration_minutes = Math.max(1, Math.round(data.duration_s / 60));
        }
        if (typeof data.distance_m === "number") {
          nextMeta.estimated_total_distance_km = Math.round((data.distance_m / 1000) * 10) / 10;
        }
        return {
          ...p,
          route_journey: {
            ...j,
            path: data.path!,
            metadata: nextMeta,
          },
        };
      });
      setSaveNotice("OSRM 응답으로 폴리라인과 거리·시간 추정을 갱신했습니다.");
    } finally {
      setRouting(false);
    }
  }

  const format = post.post_format ?? "hybrid";

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-[min(100%,96rem)] gap-8 lg:grid-cols-2 lg:gap-10">
      <div className="space-y-10 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href={GUARDIAN_WORKSPACE.posts}>{COPY.back}</Link>
          </Button>
          <p className="text-muted-foreground text-xs">
            {mode === "create" ? "새 루트 포스트" : `편집 · ${post.id}`}
            {persistedPostId ? <span className="text-primary ml-2 font-mono">· DB {persistedPostId.slice(0, 8)}…</span> : null}
          </p>
        </div>

        {saveError ? (
          <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">{saveError}</p>
        ) : null}
        {saveNotice ? (
          <p className="border-primary/20 bg-primary/5 text-foreground rounded-xl border px-4 py-3 text-sm">{saveNotice}</p>
        ) : null}

        <nav aria-label="포스트 작성 단계" className="border-border/50 rounded-2xl border bg-card/60 px-3 py-3">
          <ol className="text-muted-foreground flex flex-wrap gap-x-2 gap-y-1.5 text-[11px] font-medium sm:gap-x-3 sm:text-xs">
            {(
              [
                COPY.flowStep1,
                COPY.flowStep2,
                COPY.flowStep3,
                COPY.flowStep4,
                COPY.flowStep5,
                COPY.flowStep6,
              ] as const
            ).map((label, i) => (
              <li key={label} className="flex items-center gap-1.5">
                <span className="bg-primary/15 text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  {i + 1}
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </li>
            ))}
          </ol>
        </nav>

        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">{COPY.typeTitle}</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["spot", COPY.typeSpot],
                ["route", COPY.typeRoute],
                ["hybrid", COPY.typeHybrid],
              ] as const
            ).map(([v, label]) => (
              <Button
                key={v}
                type="button"
                size="sm"
                variant={format === v ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setFormat(v)}
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">{COPY.typeHint}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-foreground text-sm font-semibold">{COPY.basicTitle}</h2>
          <div className="space-y-2">
            <Label htmlFor="rt-title">{COPY.title}</Label>
            <Input
              id="rt-title"
              value={post.title}
              onChange={(e) => setPost((p) => ({ ...p, title: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rt-summary">{COPY.summary}</Label>
            <Textarea
              id="rt-summary"
              value={post.summary}
              onChange={(e) => setPost((p) => ({ ...p, summary: e.target.value }))}
              className="rounded-xl"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rt-tags">{COPY.tags}</Label>
            <Input
              id="rt-tags"
              value={post.tags.join(", ")}
              onChange={(e) =>
                setPost((p) => ({
                  ...p,
                  tags: e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                }))
              }
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rt-kind">{COPY.kindLabel}</Label>
            <select
              id="rt-kind"
              className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
              value={post.kind}
              onChange={(e) => setPost((p) => ({ ...p, kind: e.target.value as ContentPostKind }))}
            >
              {KIND_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs leading-relaxed">{COPY.kindHint}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rt-hero-subject">{COPY.heroSubjectLabel}</Label>
            <select
              id="rt-hero-subject"
              className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
              value={post.hero_subject ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setPost((p) => ({
                  ...p,
                  hero_subject: v === "" ? null : (v as ContentPostHeroSubject),
                }));
              }}
            >
              <option value="">{COPY.heroSubjectAuto}</option>
              {HERO_SUBJECT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs leading-relaxed">{COPY.heroSubjectHint}</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-foreground text-sm font-semibold">{COPY.metaTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{COPY.transport}</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
                value={journey.metadata.transport_mode}
                onChange={(e) =>
                  updateMeta({ transport_mode: e.target.value as RouteJourney["metadata"]["transport_mode"] })
                }
              >
                <option value="walk">walk</option>
                <option value="car">car</option>
                <option value="mixed">mixed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{COPY.timeOfDay}</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
                value={journey.metadata.recommended_time_of_day}
                onChange={(e) =>
                  updateMeta({
                    recommended_time_of_day: e.target.value as RouteJourney["metadata"]["recommended_time_of_day"],
                  })
                }
              >
                <option value="morning">morning</option>
                <option value="afternoon">afternoon</option>
                <option value="evening">evening</option>
                <option value="night">night</option>
                <option value="flexible">flexible</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-dur">{COPY.duration}</Label>
              <Input
                id="rt-dur"
                type="number"
                min={0}
                value={journey.metadata.estimated_total_duration_minutes}
                onChange={(e) => updateMeta({ estimated_total_duration_minutes: Number(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-dist">{COPY.distance}</Label>
              <Input
                id="rt-dist"
                type="number"
                step="0.1"
                min={0}
                value={journey.metadata.estimated_total_distance_km}
                onChange={(e) => updateMeta({ estimated_total_distance_km: Number(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>{COPY.difficulty}</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
                value={journey.metadata.difficulty}
                onChange={(e) => updateMeta({ difficulty: e.target.value as RouteJourney["metadata"]["difficulty"] })}
              >
                <option value="easy">easy</option>
                <option value="moderate">moderate</option>
                <option value="active">active</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rt-tt">{COPY.travelerTypes}</Label>
              <Input
                id="rt-tt"
                value={journey.metadata.recommended_traveler_types.join(", ")}
                onChange={(e) =>
                  updateMeta({
                    recommended_traveler_types: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
                className="rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="rt-night"
                type="checkbox"
                checked={journey.metadata.night_friendly}
                onChange={(e) => updateMeta({ night_friendly: e.target.checked })}
              />
              <Label htmlFor="rt-night">{COPY.night}</Label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-foreground text-sm font-semibold">{COPY.spotEditorTitle}</h2>
            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">{COPY.spotSearchLead}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardian-spot-search" className="text-foreground">
              {COPY.searchLabel}
            </Label>
            <Input
              id="guardian-spot-search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={COPY.searchPlaceholder}
              className="rounded-xl"
              autoComplete="off"
            />
            <ul className="border-border/60 max-h-52 overflow-auto rounded-xl border bg-white/80 text-sm shadow-[var(--shadow-sm)]">
              {filteredPlaces.length === 0 ? (
                <li className="text-muted-foreground px-3 py-4 text-center text-xs">검색 결과가 없습니다.</li>
              ) : (
                filteredPlaces.map((p) => (
                  <li key={p.id} className="border-border/40 border-b last:border-b-0">
                    <button
                      type="button"
                      className="hover:bg-muted/50 flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors"
                      onClick={() => addPlaceFromSearch(p)}
                    >
                      <span className="text-foreground font-semibold">{p.label_ko}</span>
                      <span className="text-muted-foreground text-xs leading-snug">{p.address}</span>
                      <span className="text-muted-foreground text-[11px]">{p.district}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="border-border/50 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-muted-foreground shrink-0 text-[11px] font-semibold tracking-wide uppercase">
              {COPY.mapAddSectionLabel}
            </span>
            <Button
              type="button"
              size="sm"
              variant={mapPick ? "default" : "outline"}
              className="w-fit rounded-xl gap-1.5"
              onClick={() => setMapPick((v) => !v)}
            >
              <MapPin className="size-4" />
              {COPY.mapAddSecondary}
            </Button>
            {mapPick ? (
              <p className="text-primary text-xs font-medium sm:ml-1">{COPY.mapPickBanner}</p>
            ) : null}
          </div>

          <ul className="space-y-2">
            {[...journey.spots]
              .sort((a, b) => a.order - b.order)
              .map((s, index) => (
                <li
                  key={s.id}
                  className={cn(
                    "border-border/60 flex flex-wrap items-center gap-2 rounded-xl border bg-white/90 p-3",
                    selectedSpotId === s.id && "ring-primary ring-2",
                  )}
                >
                  <button type="button" className="min-w-0 flex-1 text-left font-medium" onClick={() => setSelectedSpotId(s.id)}>
                    <span className="text-primary mr-2 font-mono text-xs">{index + 1}</span>
                    {s.title || s.place_name || "무제 스팟"}
                  </button>
                  {s.featured ? <Star className="size-4 fill-amber-400 text-amber-500" /> : null}
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => moveSpot(index, -1)} aria-label="위로">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => moveSpot(index, 1)} aria-label="아래로">
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => duplicateSpot(s.id)} aria-label="복제">
                    <Copy className="size-4" />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => toggleFeatured(s.id)} aria-label="피처드">
                    <Star className="size-4" />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" className="text-destructive" onClick={() => removeSpot(s.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
          </ul>

          {selectedSpot ? (
            <div className="border-border/60 space-y-3 rounded-2xl border bg-white/95 p-4">
              <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">선택된 스팟</p>
              <div className="border-border/50 space-y-1 rounded-xl border bg-muted/15 p-3">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">{COPY.selectedLocation}</p>
                <p className="text-foreground text-sm font-semibold">
                  {selectedSpot.place_name?.trim() || selectedSpot.title?.trim() || "—"}
                </p>
                {selectedSpot.address_line ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">{selectedSpot.address_line}</p>
                ) : null}
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {selectedSpot.lat != null && selectedSpot.lng != null ? COPY.locationPinned : COPY.locationNeed}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>스팟 제목</Label>
                  <Input value={selectedSpot.title} onChange={(e) => updateSpot(selectedSpot.id, { title: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>장소명</Label>
                  <Input
                    value={selectedSpot.place_name}
                    onChange={(e) => updateSpot(selectedSpot.id, { place_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>주소</Label>
                  <Input
                    value={selectedSpot.address_line ?? ""}
                    onChange={(e) =>
                      updateSpot(selectedSpot.id, {
                        address_line: e.target.value.trim() ? e.target.value.trim() : undefined,
                      })
                    }
                    className="rounded-xl"
                    placeholder="장소 검색 시 자동으로 채워집니다"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>짧은 설명</Label>
                  <Textarea
                    value={selectedSpot.short_description}
                    onChange={(e) => updateSpot(selectedSpot.id, { short_description: e.target.value })}
                    className="rounded-xl"
                    rows={2}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>본문</Label>
                  <Textarea
                    value={selectedSpot.body}
                    onChange={(e) => updateSpot(selectedSpot.id, { body: e.target.value })}
                    className="rounded-xl"
                    rows={4}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>추천 이유</Label>
                  <Textarea
                    value={selectedSpot.recommend_reason}
                    onChange={(e) => updateSpot(selectedSpot.id, { recommend_reason: e.target.value })}
                    className="rounded-xl"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>체류(분)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={selectedSpot.stay_duration_minutes}
                    onChange={(e) => updateSpot(selectedSpot.id, { stay_duration_minutes: Number(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>이미지 URL <span className="text-muted-foreground font-normal">({selectedSpot.image_urls.length}/10)</span></Label>
                    {selectedSpot.image_urls.length < 10 && (
                      <button
                        type="button"
                        onClick={() => updateSpot(selectedSpot.id, { image_urls: [...selectedSpot.image_urls, ""] })}
                        className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                      >
                        + URL 추가
                      </button>
                    )}
                  </div>
                  {selectedSpot.image_urls.length === 0 && (
                    <button
                      type="button"
                      onClick={() => updateSpot(selectedSpot.id, { image_urls: [""] })}
                      className="border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground w-full rounded-xl border border-dashed py-2.5 text-xs font-medium transition-colors"
                    >
                      + 첫 번째 이미지 URL 추가
                    </button>
                  )}
                  <div className="space-y-2">
                    {selectedSpot.image_urls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-muted-foreground w-5 shrink-0 text-center text-xs font-medium">{idx + 1}</span>
                        <Input
                          value={url}
                          onChange={(e) => {
                            const next = [...selectedSpot.image_urls];
                            next[idx] = e.target.value;
                            updateSpot(selectedSpot.id, { image_urls: next });
                          }}
                          className="rounded-xl"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = selectedSpot.image_urls.filter((_, i) => i !== idx);
                            updateSpot(selectedSpot.id, { image_urls: next });
                          }}
                          className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                          aria-label="URL 삭제"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {selectedSpot.image_urls.length > 0 && selectedSpot.image_urls.length < 10 && (
                    <p className="text-muted-foreground text-[11px]">최대 10장 · URL을 직접 입력하거나 붙여넣으세요</p>
                  )}
                  {selectedSpot.image_urls.length >= 10 && (
                    <p className="text-muted-foreground text-[11px]">최대 10장에 도달했습니다</p>
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>포토 팁</Label>
                  <Input
                    value={selectedSpot.photo_tip}
                    onChange={(e) => updateSpot(selectedSpot.id, { photo_tip: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>주의</Label>
                  <Input
                    value={selectedSpot.caution}
                    onChange={(e) => updateSpot(selectedSpot.id, { caution: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-8 gap-1 px-0 text-xs font-medium hover:bg-transparent"
                    onClick={() => setShowAdvancedCoords((v) => !v)}
                  >
                    {showAdvancedCoords ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    {showAdvancedCoords ? COPY.advancedCoordsHide : COPY.advancedCoords}
                  </Button>
                  {showAdvancedCoords ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>위도</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={selectedSpot.lat}
                          onChange={(e) => updateSpot(selectedSpot.id, { lat: Number(e.target.value) })}
                          className="rounded-xl font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>경도</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={selectedSpot.lng}
                          onChange={(e) => updateSpot(selectedSpot.id, { lng: Number(e.target.value) })}
                          className="rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>루트 하이라이트 (줄바꿈으로 구분)</Label>
            <Textarea
              value={(post.route_highlights ?? []).join("\n")}
              onChange={(e) =>
                setPost((p) => ({
                  ...p,
                  route_highlights: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                }))
              }
              className="rounded-xl"
              rows={3}
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5">
            <div>
              <h3 className="text-foreground text-sm font-semibold">{COPY.structuredSectionTitle}</h3>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{COPY.structuredHint}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="struct-intro">{COPY.structIntro}</Label>
              <Textarea
                id="struct-intro"
                value={routeDraft.intro}
                onChange={(e) => setRouteDraft((d) => ({ ...d, intro: e.target.value }))}
                className="rounded-xl"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="struct-sum">{COPY.structRouteSummary}</Label>
              <Textarea
                id="struct-sum"
                value={routeDraft.route_summary}
                onChange={(e) => setRouteDraft((d) => ({ ...d, route_summary: e.target.value }))}
                className="rounded-xl"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="struct-bf">{COPY.structRouteBestFor}</Label>
              <Textarea
                id="struct-bf"
                value={routeDraft.route_best_for ?? ""}
                onChange={(e) => setRouteDraft((d) => ({ ...d, route_best_for: e.target.value || undefined }))}
                className="rounded-xl"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="struct-notes">{COPY.structRouteNotes}</Label>
              <Textarea
                id="struct-notes"
                value={routeDraft.route_notes}
                onChange={(e) => setRouteDraft((d) => ({ ...d, route_notes: e.target.value }))}
                className="rounded-xl"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="struct-narr">{COPY.structNarrative}</Label>
              <Textarea
                id="struct-narr"
                value={routeDraft.narrative}
                onChange={(e) => setRouteDraft((d) => ({ ...d, narrative: e.target.value }))}
                className="rounded-xl"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="struct-close">{COPY.structClosing}</Label>
              <Textarea
                id="struct-close"
                value={routeDraft.closing}
                onChange={(e) => setRouteDraft((d) => ({ ...d, closing: e.target.value }))}
                className="rounded-xl"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="struct-guard">{COPY.structGuardian}</Label>
              <Textarea
                id="struct-guard"
                value={routeDraft.guardian_signature}
                onChange={(e) => setRouteDraft((d) => ({ ...d, guardian_signature: e.target.value }))}
                className="rounded-xl"
                rows={2}
              />
            </div>
          </div>
        </section>

        <GuardianPostAiMetaPanel post={post} onApply={(next) => setPost(next)} />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="gap-2 rounded-2xl"
            disabled={saving}
            onClick={() => void onSaveDraft()}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {COPY.saving}
              </>
            ) : (
              COPY.saveDraft
            )}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="rounded-2xl"
            disabled={!persistedPostId || previewBusy}
            onClick={() => void onOpenPreview()}
          >
            {previewBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : COPY.preview}
          </Button>
          <Button
            type="button"
            size="lg"
            className="gap-2 rounded-2xl"
            disabled={saving}
            onClick={() => void onPublish()}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {COPY.saving}
              </>
            ) : (
              COPY.publish
            )}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 flex h-[min(560px,70vh)] flex-col gap-3 self-start">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-primary text-[10px] font-bold tracking-widest uppercase">Live preview</p>
            <p className="text-foreground text-sm font-semibold">{COPY.mapPanelTitle}</p>
          </div>
          {mapPick ? <Badge className="rounded-full">지도 선택 모드</Badge> : null}
        </div>
        <p className="text-muted-foreground text-xs">{COPY.mapPanelHint}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-2 rounded-xl"
            disabled={routing || journey.spots.length < 2}
            onClick={() => void refreshRouteFromOsrm()}
          >
            {routing ? <Loader2 className="size-4 animate-spin" /> : null}
            {COPY.routeOsrm}
          </Button>
          <p className="text-muted-foreground max-w-md text-[11px] leading-snug">{COPY.routeOsrmHint}</p>
        </div>
        <div className="border-border/60 relative min-h-0 flex-1 overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-md)]">
          <RouteMapPreview
            spots={journey.spots}
            path={journey.path}
            selectedSpotId={selectedSpotId}
            onSpotSelect={(id) => setSelectedSpotId(id)}
            mapClickEnabled={mapPick}
            onMapClick={(lat, lng) => addSpotAt(lat, lng, "", true)}
            className="h-full min-h-[280px]"
          />
        </div>
        <div className="border-border/60 flex flex-wrap gap-2 rounded-2xl border bg-white/90 p-4 text-xs">
          <Badge variant="secondary" className="rounded-full font-medium">
            {journey.metadata.estimated_total_distance_km} km
          </Badge>
          <Badge variant="secondary" className="rounded-full font-medium">
            {journey.metadata.estimated_total_duration_minutes}분
          </Badge>
          <Badge variant="secondary" className="rounded-full font-medium">
            스팟 {journey.spots.length}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {journey.metadata.transport_mode}
          </Badge>
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-full">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
