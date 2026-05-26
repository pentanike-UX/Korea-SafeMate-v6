"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ContentPost,
  ContentPostFormat,
  ContentPostHeroSubject,
  ContentPostKind,
  HaruwayTheme,
  PostStructuredContentV1,
  RouteJourney,
  RoutePostStructuredContentV1,
  RouteSpot,
} from "@/types/domain";
import { HARUWAY_THEME_LABELS, POST_STRUCTURED_CONTENT_VERSION } from "@/types/domain";
import { GuardianHaruwayGuideBanner } from "@/components/guardian/guardian-haruway-guide-banner";
import { GuardianSpotTypeInput } from "@/components/guardian/guardian-spot-type-input";
import { GuardianSpotCommerceInput } from "@/components/guardian/guardian-spot-commerce-input";
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider";
import { GoogleMapDrawer, type MapPickResult } from "@/components/maps/google-map-drawer";
import { inferRouteStructuredDraftFromPost, routeDataToArticleParsed, serializeRoutePostToShellBody } from "@/lib/post-structured-content";
import { formatRouteSummaryMeta } from "@/lib/post-seed-content-templates";
import { saveGuardianRoutePostAction } from "@/app/[locale]/(authed)/guardian/posts/actions";
import { signGuardianPostPreviewTokenAction } from "@/app/[locale]/(authed)/guardian/posts/preview-token-action";
import { GUARDIAN_WORKSPACE } from "@/lib/mypage/guardian-workspace-routes";
import type { GuardianPostSavePayload } from "@/lib/guardian-posts-api";
import { isUuidString } from "@/lib/guardian-posts-api";
import { RouteMapPreview } from "@/components/maps/route-map-preview";
import { RouteDayPreview } from "@/components/route-posts/route-day-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockSeoulSearchPlaces } from "@/data/mock/guardian-mock-places";
import { GuardianPostAiMetaPanel } from "@/components/guardian/guardian-post-ai-meta-panel";
import { fmtSpotDistance, nextMoveEmoji } from "@/lib/route-spot-formatting";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, ChevronUp, Copy, Loader2, Map, MapPin, StickyNote, Star, Trash2, Wand2 } from "lucide-react";

// ─── 금지 표현 감지 ──────────────────────────────────────────────────
const BANNED_PHRASES = [
  /권장합니다/,
  /가능합니다/,
  /무난합니다/,
  /유지됩니다/,
  /편리합니다/,
  /체크하세요/,
  /\b동선\b/,
];

function detectBanned(text: string): string[] {
  return BANNED_PHRASES.filter((re) => re.test(text)).map((re) => re.source.replace(/\\b/g, ""));
}

function hasBanned(text: string): boolean {
  return BANNED_PHRASES.some((re) => re.test(text));
}

// ─── AI 보정 (규칙 기반 행동형 변환) ─────────────────────────────────
function applyActionCorrection(text: string): string {
  return text
    .replace(/권장합니다/g, "하세요")
    .replace(/가능합니다/g, "됩니다")
    .replace(/무난합니다/g, "괜찮습니다")
    .replace(/유지됩니다/g, "이어집니다")
    .replace(/편리합니다/g, "좋습니다")
    .replace(/체크하세요/g, "확인하세요")
    .replace(/동선/g, "이동 흐름");
}

// ─── FieldMemo 타입 ───────────────────────────────────────────────────
interface FieldMemo {
  orientation: string; // 기준 잡기 → route_summary 2단락
  prep: string;        // 먼저 정리할 것 → route_notes
  crowd: string;       // 사람 많을 때 → route_highlights[0]
  vibe: string;        // 분위기 → closing 1단락
  quote: string;       // 한 줄 메모 → closing 2단락
}

function initFieldMemoFromDraft(draft: RoutePostStructuredContentV1, highlights: string[]): FieldMemo {
  const summaryParas = draft.route_summary.split(/\n\n+/);
  const closingParas = draft.closing.split(/\n\n+/);
  return {
    orientation: summaryParas[1]?.trim() ?? "",
    prep: draft.route_notes.trim(),
    crowd: highlights[0]?.trim() ?? "",
    vibe: closingParas[0]?.trim() ?? "",
    quote: closingParas[1]?.trim() ?? "",
  };
}

// ─── 필드 메모 입력 단위 컴포넌트 ────────────────────────────────────
function FieldMemoInput({
  label,
  value,
  placeholder,
  rows = 2,
  onChange,
  onCorrect,
}: {
  label: string;
  value: string;
  placeholder: string;
  rows?: number;
  onChange: (v: string) => void;
  onCorrect: () => void;
}) {
  const banned = detectBanned(value);
  const warn = banned.length > 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[13px] font-semibold">{label}</Label>
        <button
          type="button"
          onClick={onCorrect}
          className="text-primary hover:text-primary/75 flex items-center gap-1 text-[11px] font-medium transition-colors"
          title="금지 표현을 행동형으로 자동 변환합니다"
        >
          <Wand2 className="size-3" />
          AI 보정
        </button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "rounded-xl text-sm transition-colors",
          warn && "border-amber-400 ring-1 ring-amber-300/60 focus-visible:ring-amber-400",
        )}
      />
      {warn && (
        <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-400">
            금지 표현 감지: {banned.join(", ")} — AI 보정 버튼으로 변환하세요
          </p>
        </div>
      )}
    </div>
  );
}

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
    theme: p.theme,
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
  mapPanelTitle: "이 하루이의 추천 여행경로",
  mapPanelHint: "핀을 눌러 스팟 선택 · 보조 「지도에서 직접 선택」 켠 뒤 빈 곳을 탭하면 스팟이 추가됩니다.",
  routeOsrm: "경로·도보 시간 계산",
  routeOsrmHint: "Google Directions(도보·차량) 우선, 키 미설정 시 OSRM 공개 서버로 폴백.",
  saving: "저장 중…",
  savedPending: "검토 대기(pending)로 저장됨",
  flowStep1: "유형",
  flowStep2: "기본 정보",
  flowStep3: "스팟",
  flowStep4: "현장 메모",
  flowStep5: "AI 추천",
  flowStep6: "발행",
  fieldMemoTitle: "현장 메모",
  fieldMemoHint: "5개 입력값이 사용자 카드로 자동 변환됩니다. 금지 표현 감지 시 주황 경고가 표시됩니다.",
  structIntro: "이 포스트가 맞는 사람",
  structRouteBestFor: "이 루트가 잘 맞는 분 (선택)",
  structGuardian: "하루이 한 줄 제안",
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
  // Google Maps 드로어 — 특정 스팟의 위치를 검색/지도 클릭으로 선택
  const [mapDrawerSpotId, setMapDrawerSpotId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [routing, setRouting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [rightPanel, setRightPanel] = useState<"map" | "preview">("map");

  // ─── 현장 메모 상태 ───────────────────────────────────────────────
  const [fieldMemo, setFieldMemo] = useState<FieldMemo>(() =>
    initFieldMemoFromDraft(inferRouteStructuredDraftFromPost(initialPost), initialPost.route_highlights ?? []),
  );

  // fieldMemo → routeDraft + route_highlights 자동 동기화
  useEffect(() => {
    const meta = post.route_journey?.metadata;
    const statsMeta = meta ? formatRouteSummaryMeta(meta) : "";
    const orientationTip = fieldMemo.orientation.trim();
    const newRouteSummary = orientationTip ? `${statsMeta}\n\n${orientationTip}` : statsMeta;
    const vibe = fieldMemo.vibe.trim();
    const quote = fieldMemo.quote.trim();
    const newClosing = vibe ? (quote ? `${vibe}\n\n${quote}` : vibe) : quote;

    setRouteDraft((d) => ({
      ...d,
      route_summary: newRouteSummary,
      route_notes: fieldMemo.prep.trim(),
      closing: newClosing,
    }));

    if (fieldMemo.crowd.trim()) {
      setPost((p) => ({
        ...p,
        route_highlights: [fieldMemo.crowd.trim(), ...(p.route_highlights ?? []).slice(1)],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldMemo]);

  // 현장 메모 단일 필드 업데이트 헬퍼
  function updateFieldMemo<K extends keyof FieldMemo>(key: K, val: FieldMemo[K]) {
    setFieldMemo((m) => ({ ...m, [key]: val }));
  }

  // AI 보정 단일 필드
  function correctField(key: keyof FieldMemo) {
    setFieldMemo((m) => ({ ...m, [key]: applyActionCorrection(m[key]) }));
  }

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
    const payload = buildSavePayload({ ...post, status: "approved" }, routeDraft, "approved");
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
      setPost((p) => ({ ...p, id: result.id, status: "approved" }));
      setSaveNotice("게시 완료 — 목록에 바로 노출됩니다.");
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

      type RoutingResult = {
        error?: string;
        path?: { lat: number; lng: number }[];
        distance_m?: number | null;
        duration_s?: number | null;
        legs?: { distance_m: number | null; duration_s: number | null }[];
        provider?: string;
      };

      async function call(endpoint: string) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates, profile }),
        });
        const data = (await res.json()) as RoutingResult & { retry_with?: string };
        return { res, data };
      }

      // 1) Google Directions 우선 — 키 없거나 5xx면 OSRM 폴백.
      let result = await call("/api/routing/google");
      let providerLabel = "Google Directions";
      if (!result.res.ok) {
        const shouldFallback =
          result.res.status === 503 || result.data.retry_with === "osrm" || result.res.status >= 500;
        if (shouldFallback) {
          result = await call("/api/routing/osrm");
          providerLabel = "OSRM";
        }
      }

      const { res, data } = result;
      if (!res.ok) {
        setSaveError(data.error ?? "경로 계산 실패");
        return;
      }
      if (!data.path?.length) {
        setSaveError("경로 좌표가 비어 있습니다.");
        return;
      }

      const moveMode: RouteSpot["next_move_mode"] =
        journey.metadata.transport_mode === "car" ? "taxi" : "walk";

      setPost((p) => {
        const j = p.route_journey!;
        const nextMeta = { ...j.metadata };
        if (typeof data.duration_s === "number") {
          nextMeta.estimated_total_duration_minutes = Math.max(1, Math.round(data.duration_s / 60));
        }
        if (typeof data.distance_m === "number") {
          nextMeta.estimated_total_distance_km = Math.round((data.distance_m / 1000) * 10) / 10;
        }

        // legs[i] = sorted[i] → sorted[i+1] 구간. 스팟 id 기준으로 매핑해 정렬 변동에도 안전.
        // (lucide-react의 `Map` 아이콘이 글로벌 Map을 가려서 plain 객체 사용)
        const legByFromId: Record<string, { duration_s: number | null; distance_m: number | null }> = {};
        if (Array.isArray(data.legs)) {
          for (let i = 0; i < data.legs.length && i < sorted.length - 1; i += 1) {
            legByFromId[sorted[i].id] = data.legs[i];
          }
        }

        const nextSpots = j.spots.map((s) => {
          const leg = legByFromId[s.id];
          if (!leg) return s;
          const minutes =
            typeof leg.duration_s === "number" ? Math.max(1, Math.round(leg.duration_s / 60)) : undefined;
          const meters =
            typeof leg.distance_m === "number" ? Math.max(0, Math.round(leg.distance_m)) : undefined;
          if (minutes == null && meters == null) return s;
          return {
            ...s,
            ...(minutes != null ? { next_move_minutes: minutes } : {}),
            ...(meters != null ? { next_move_distance_m: meters } : {}),
            next_move_mode: s.next_move_mode ?? moveMode,
          };
        });

        return {
          ...p,
          route_journey: {
            ...j,
            path: data.path!,
            spots: nextSpots,
            metadata: nextMeta,
          },
        };
      });

      const legCount = Array.isArray(data.legs) ? data.legs.length : 0;
      setSaveNotice(
        legCount > 0
          ? `${providerLabel} 응답으로 폴리라인·거리·시간 + 스팟별 다음 이동(${legCount}구간) 갱신.`
          : `${providerLabel} 응답으로 폴리라인·거리·시간을 갱신했습니다.`,
      );
    } finally {
      setRouting(false);
    }
  }

  const format = post.post_format ?? "hybrid";

  // ─── 지도 드로어 confirm 핸들러 ────────────────────────────────────
  const mapDrawerSpot = mapDrawerSpotId
    ? journey.spots.find((s) => s.id === mapDrawerSpotId)
    : null;
  const onMapDrawerConfirm = (res: MapPickResult) => {
    if (!mapDrawerSpotId) return;
    const patch: Partial<RouteSpot> = { lat: res.lat, lng: res.lng };
    if (res.place) {
      // 검색 결과로 선택된 경우: 장소명·주소·Google 바인딩까지 자동 채움
      patch.place_name = res.place.name;
      if (res.place.formattedAddress) patch.address_line = res.place.formattedAddress;
      patch.google = {
        placeId: res.place.placeId,
        displayName: res.place.name,
        formattedAddress: res.place.formattedAddress,
        location: { lat: res.lat, lng: res.lng },
      };
    }
    updateSpot(mapDrawerSpotId, patch);
  };

  return (
    <GoogleMapsProvider>
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-[min(100%,96rem)] gap-8 lg:grid-cols-2 lg:gap-10">
      <div className="min-w-0 space-y-10 pb-28 sm:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href={GUARDIAN_WORKSPACE.posts}>{COPY.back}</Link>
          </Button>
          <p className="text-muted-foreground text-xs">
            {mode === "create" ? "새 루트 포스트" : "편집 모드"}
            {persistedPostId ? <span className="text-primary ml-2 font-mono">· DB {persistedPostId.slice(0, 8)}…</span> : null}
          </p>
        </div>

        <GuardianHaruwayGuideBanner />

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

        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <h2 className="text-foreground text-base font-semibold tracking-tight">{COPY.typeTitle}</h2>
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

        <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <h2 className="text-foreground text-base font-semibold tracking-tight">{COPY.basicTitle}</h2>
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
              className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
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
            <Label htmlFor="rt-theme">하루웨이 테마</Label>
            <select
              id="rt-theme"
              className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
              value={post.theme ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setPost((p) => ({ ...p, theme: v ? (v as HaruwayTheme) : undefined }));
              }}
            >
              <option value="">(미설정 — 태그로 폴백)</option>
              {(Object.keys(HARUWAY_THEME_LABELS) as HaruwayTheme[]).map((t) => (
                <option key={t} value={t}>
                  {HARUWAY_THEME_LABELS[t]}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs leading-relaxed">
              포스트의 큰 주제 (K-POP / K-DRAMA / K-FOOD ...). 추천·검색에 사용됩니다.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rt-hero-subject">{COPY.heroSubjectLabel}</Label>
            <select
              id="rt-hero-subject"
              className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
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

        <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <h2 className="text-foreground text-base font-semibold tracking-tight">{COPY.metaTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{COPY.transport}</Label>
              <select
                className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
                value={journey.metadata.transport_mode}
                onChange={(e) =>
                  updateMeta({ transport_mode: e.target.value as RouteJourney["metadata"]["transport_mode"] })
                }
              >
                <option value="walk">도보</option>
                <option value="car">차량</option>
                <option value="mixed">도보·차 병행</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{COPY.timeOfDay}</Label>
              <select
                className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
                value={journey.metadata.recommended_time_of_day}
                onChange={(e) =>
                  updateMeta({
                    recommended_time_of_day: e.target.value as RouteJourney["metadata"]["recommended_time_of_day"],
                  })
                }
              >
                <option value="morning">오전</option>
                <option value="afternoon">오후</option>
                <option value="evening">저녁</option>
                <option value="night">밤</option>
                <option value="flexible">자유</option>
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
                className="border-input bg-background h-11 w-full rounded-xl border px-3 text-sm"
                value={journey.metadata.difficulty}
                onChange={(e) => updateMeta({ difficulty: e.target.value as RouteJourney["metadata"]["difficulty"] })}
              >
                <option value="easy">가벼움</option>
                <option value="moderate">보통</option>
                <option value="active">활동적</option>
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

        <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <div>
            <h2 className="text-foreground text-base font-semibold tracking-tight">{COPY.spotEditorTitle}</h2>
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
            <ul className="border-border/60 max-h-52 overflow-auto rounded-xl border bg-card text-sm shadow-[var(--shadow-sm)]">
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
            {(() => {
              const sortedSpots = [...journey.spots].sort((a, b) => a.order - b.order);
              return sortedSpots.map((s, index) => {
                const isLast = index === sortedSpots.length - 1;
                const hasLeg = !isLast && (s.next_move_minutes != null || s.next_move_distance_m != null);
                return (
                  <li key={s.id} className="space-y-1.5">
                    <div
                      className={cn(
                        "border-border/60 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3",
                        selectedSpotId === s.id && "ring-primary ring-2",
                      )}
                    >
                      <button type="button" className="w-full min-w-0 text-left text-sm font-semibold sm:w-auto sm:flex-1" onClick={() => setSelectedSpotId(s.id)}>
                        <span className="text-primary mr-2 font-mono text-xs">{index + 1}</span>
                        {s.title || s.place_name || "무제 스팟"}
                      </button>
                      {s.featured ? <Star className="size-4 fill-amber-400 text-amber-500" /> : null}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-[var(--brand-primary)]"
                        onClick={() => {
                          setSelectedSpotId(s.id);
                          setMapDrawerSpotId(s.id);
                        }}
                        aria-label={`스팟 ${index + 1} 지도에서 위치 선택`}
                        title="지도에서 위치 선택"
                      >
                        <MapPin className="size-4" />
                      </Button>
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
                    </div>
                    {hasLeg ? (
                      <div className="text-muted-foreground flex items-center gap-2 pl-3 text-[11px] leading-tight">
                        <span aria-hidden>{nextMoveEmoji(s.next_move_mode)}</span>
                        <span>
                          {s.next_move_minutes != null ? `${s.next_move_minutes}분` : ""}
                          {s.next_move_minutes != null && s.next_move_distance_m != null ? " · " : ""}
                          {s.next_move_distance_m != null ? fmtSpotDistance(s.next_move_distance_m) : ""}
                          <span className="text-muted-foreground/60"> 다음 스팟까지</span>
                        </span>
                      </div>
                    ) : null}
                  </li>
                );
              });
            })()}
          </ul>

          {selectedSpot ? (
            <div className="border-border/60 space-y-3 rounded-2xl border bg-card p-4">
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
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-5 shrink-0 text-center text-xs font-medium">{idx + 1}</span>
                          <Input
                            value={url}
                            onChange={(e) => {
                              const next = [...selectedSpot.image_urls];
                              next[idx] = e.target.value;
                              updateSpot(selectedSpot.id, { image_urls: next });
                            }}
                            className="rounded-xl"
                            placeholder="/mock/posts/... 또는 https://..."
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
                        {url.trim() && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url.trim()}
                            alt={`이미지 ${idx + 1} 미리보기`}
                            className="ml-7 h-20 w-32 rounded-lg border border-border/50 object-cover bg-muted"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                            onLoad={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "block";
                            }}
                          />
                        )}
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
                  <Label htmlFor="rt-spot-related-artists">관련 아티스트 (쉼표로 구분)</Label>
                  <Input
                    id="rt-spot-related-artists"
                    value={(selectedSpot.related_artists ?? []).join(", ")}
                    onChange={(e) => {
                      const next = e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                      updateSpot(selectedSpot.id, {
                        related_artists: next.length ? next : undefined,
                      });
                    }}
                    placeholder="예: BTS, CL, 이날치"
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    K-POP·K-DRAMA·K-MOVIE 등 테마 포스트에서 이 스팟과 연결된 아티스트·작품 인물을 적습니다. 사용자 시트의 아티스트 카드와 연결됩니다.
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>스팟 유형 (복수 선택)</Label>
                  <GuardianSpotTypeInput
                    value={selectedSpot.spot_types}
                    onChange={(next) =>
                      updateSpot(selectedSpot.id, { spot_types: next.length ? next : undefined })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <GuardianSpotCommerceInput
                    value={selectedSpot.commerce}
                    onChange={(next) => updateSpot(selectedSpot.id, { commerce: next })}
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

          {/* ── 현장 메모 블록 ──────────────────────────────────────── */}
          <div className="space-y-5 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/20 to-background p-5">
            <div className="space-y-1">
              <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <StickyNote className="size-4 text-primary/70" />
                {COPY.fieldMemoTitle}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{COPY.fieldMemoHint}</p>
            </div>

            <FieldMemoInput
              label="처음이라면 이곳을 기준으로"
              value={fieldMemo.orientation}
              placeholder="광화문 쪽 출구 먼저 찾으세요. 이곳에서 방향 잡으면 안 헤맵니다."
              onChange={(v) => updateFieldMemo("orientation", v)}
              onCorrect={() => correctField("orientation")}
            />
            <FieldMemoInput
              label="먼저 끝내세요"
              value={fieldMemo.prep}
              placeholder="화장실은 지하철 또는 궁 입구에서 해결하세요. 궁 안 들어가면 다시 나오기 번거롭습니다."
              onChange={(v) => updateFieldMemo("prep", v)}
              onCorrect={() => correctField("prep")}
            />
            <FieldMemoInput
              label="사람 많을 때는 이렇게"
              value={fieldMemo.crowd}
              placeholder="광장 중앙에서 멈추지 마세요. 옆 보행로로 빠지면 훨씬 덜 막힙니다."
              onChange={(v) => updateFieldMemo("crowd", v)}
              onCorrect={() => correctField("crowd")}
            />
            <FieldMemoInput
              label="분위기 참고"
              value={fieldMemo.vibe}
              placeholder="도깨비·서울의봄 같은 서울 중심부 느낌입니다. 광장 + 궁 + 도심이 한 번에 겹칩니다."
              onChange={(v) => updateFieldMemo("vibe", v)}
              onCorrect={() => correctField("vibe")}
            />
            <FieldMemoInput
              label="한 줄 메모 (인용구)"
              value={fieldMemo.quote}
              placeholder="궁 입장 전 화장실을 이용하세요. 궁궐 내에는 화장실이 없습니다."
              onChange={(v) => updateFieldMemo("quote", v)}
              onCorrect={() => correctField("quote")}
            />

            <div className="border-t border-border/40 pt-4 space-y-4">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">보조 정보 (선택)</p>
              <div className="space-y-2">
                <Label htmlFor="struct-intro" className="text-[13px]">{COPY.structIntro}</Label>
                <Textarea
                  id="struct-intro"
                  value={routeDraft.intro}
                  onChange={(e) => setRouteDraft((d) => ({ ...d, intro: e.target.value }))}
                  className="rounded-xl text-sm"
                  rows={2}
                  placeholder="솔로 여행자·첫 방문자에게 잘 맞는 루트입니다."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="struct-bf" className="text-[13px]">{COPY.structRouteBestFor}</Label>
                <Textarea
                  id="struct-bf"
                  value={routeDraft.route_best_for ?? ""}
                  onChange={(e) => setRouteDraft((d) => ({ ...d, route_best_for: e.target.value || undefined }))}
                  className="rounded-xl text-sm"
                  rows={2}
                  placeholder="아침 일찍 움직이는 여행자, 사진 위주 동행"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="struct-guard" className="text-[13px]">{COPY.structGuardian}</Label>
                <Textarea
                  id="struct-guard"
                  value={routeDraft.guardian_signature}
                  onChange={(e) => setRouteDraft((d) => ({ ...d, guardian_signature: e.target.value }))}
                  className="rounded-xl text-sm"
                  rows={2}
                  placeholder="박도윤: 속도가 안 맞으면 화장실 하나만 먼저 맞추고 출발하세요."
                />
              </div>
            </div>
          </div>
        </section>

        <div className="py-4">
          <GuardianPostAiMetaPanel post={post} onApply={(next) => setPost(next)} />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border/60 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg [&>button]:flex-1 sm:static sm:flex-wrap sm:items-center sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-0 sm:backdrop-blur-none sm:[&>button]:flex-none">
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

      <aside className="flex min-w-0 flex-col gap-4 self-start lg:sticky lg:top-24" aria-label="작성 보조 패널">
        {/* ── 탭 헤더 ─────────────────────────────────────────────── */}
        <div role="tablist" aria-label="우측 패널 선택" className="inline-flex w-fit items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={rightPanel === "map"}
            onClick={() => setRightPanel("map")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              rightPanel === "map"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Map className="size-3.5" aria-hidden />
            지도
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={rightPanel === "preview"}
            onClick={() => setRightPanel("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              rightPanel === "preview"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <StickyNote className="size-3.5" aria-hidden />
            카드 미리보기
          </button>
        </div>

        {/* ── 지도 패널 ────────────────────────────────────────────── */}
        {rightPanel === "map" && (
          <section role="tabpanel" aria-label="지도 패널" className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-muted-foreground text-xs leading-snug">{COPY.mapPanelHint}</p>
              {mapPick ? <Badge className="shrink-0 rounded-full">지도 선택 모드</Badge> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-fit gap-2 rounded-xl"
                disabled={routing || journey.spots.length < 2}
                onClick={() => void refreshRouteFromOsrm()}
              >
                {routing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {COPY.routeOsrm}
              </Button>
              <p className="text-muted-foreground text-[11px] leading-snug">{COPY.routeOsrmHint}</p>
            </div>

            <div className="border-border/60 relative h-[min(500px,65vh)] overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-md)]">
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

            <div className="border-border/60 rounded-2xl border bg-card p-4 text-xs">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">루트 요약</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full font-medium">{journey.metadata.estimated_total_distance_km} km</Badge>
                <Badge variant="secondary" className="rounded-full font-medium">{journey.metadata.estimated_total_duration_minutes}분</Badge>
                <Badge variant="secondary" className="rounded-full font-medium">스팟 {journey.spots.length}</Badge>
                <Badge variant="outline" className="rounded-full">{journey.metadata.transport_mode}</Badge>
              </div>
              {post.tags.length > 0 ? (
                <>
                  <p className="mt-3 mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">태그</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full">#{tag}</Badge>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </section>
        )}

        {/* ── 카드 미리보기 패널 ────────────────────────────────────── */}
        {rightPanel === "preview" && (
          <section role="tabpanel" aria-label="카드 미리보기 패널" className="flex flex-col gap-3">
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              입력값이 실제 사용자 카드로 실시간 반영됩니다. 저장 전 최종 확인에 활용하세요.
            </p>
            {(["orientation", "prep", "crowd", "vibe", "quote"] as const).some((k) => hasBanned(fieldMemo[k])) && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 dark:bg-amber-950/30">
                <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden />
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  금지 표현이 남아 있습니다. 좌측 입력에서 AI 보정을 실행하세요.
                </p>
              </div>
            )}
            <div className="max-h-[min(72vh,640px)] overflow-y-auto rounded-2xl border border-border/60 bg-muted/10 p-4">
              <RouteDayPreview
                post={post}
                introLead={post.summary}
                topHighlights={fieldMemo.crowd.trim() ? [fieldMemo.crowd.trim()] : (post.route_highlights ?? [])}
                articleParsed={{
                  routeSummary: routeDraft.route_summary || undefined,
                  beforeYouGo: fieldMemo.prep.trim() || undefined,
                  routeClosing: routeDraft.closing || undefined,
                  narrative: undefined,
                  guardianLine: routeDraft.guardian_signature.trim() || undefined,
                }}
              />
            </div>
          </section>
        )}
      </aside>

      {/* Google Maps 드로어 — 스팟별 위치 검색·선택 */}
      <GoogleMapDrawer
        open={Boolean(mapDrawerSpotId)}
        onOpenChange={(o) => setMapDrawerSpotId(o ? mapDrawerSpotId : null)}
        title={
          mapDrawerSpot
            ? `스팟 ${mapDrawerSpot.order} 위치 선택 — ${mapDrawerSpot.title || mapDrawerSpot.place_name || "무제"}`
            : "스팟 위치 선택"
        }
        initial={
          mapDrawerSpot && mapDrawerSpot.lat != null && mapDrawerSpot.lng != null
            ? { lat: mapDrawerSpot.lat, lng: mapDrawerSpot.lng }
            : undefined
        }
        onConfirm={onMapDrawerConfirm}
      />
    </div>
    </GoogleMapsProvider>
  );
}
