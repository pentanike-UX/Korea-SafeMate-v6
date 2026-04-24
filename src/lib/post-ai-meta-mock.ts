import type { ContentPost } from "@/types/domain";
import type { PostMetaAiSuggestionDraft } from "@/lib/post-ai-meta-types";
import {
  POST_META_AUDIENCE_IDS,
  POST_META_DURATION_IDS,
  POST_META_MOBILITY_IDS,
  POST_META_MOOD_IDS,
} from "@/lib/post-ai-meta-types";

function gatherCorpus(post: ContentPost): string {
  const parts = [post.title, post.summary, post.body];
  for (const s of post.route_journey?.spots ?? []) {
    parts.push(s.title, s.place_name, s.short_description, s.body, s.recommend_reason, s.photo_tip, s.caution);
  }
  return parts.join("\n").toLowerCase();
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs)];
}

function pick(pool: readonly string[], test: (id: string) => boolean, fallback: string[]): string[] {
  const hit = pool.filter(test);
  if (hit.length) return uniq(hit).slice(0, 4);
  return [...fallback];
}

/**
 * 실제 AI 호출 전 목업. 동일 시그니처의 `fetchPostMetaAiSuggestion`로 교체하면 된다.
 */
export function mockPostMetaSuggestion(post: ContentPost): PostMetaAiSuggestionDraft {
  const t = gatherCorpus(post);

  const audience = pick(
    [...POST_META_AUDIENCE_IDS],
    (id) => {
      if (id === "solo" && /혼자|솔로|1인|alone|solo/.test(t)) return true;
      if (id === "friends" && /친구|동창|우정/.test(t)) return true;
      if (id === "couple" && /커플|연인|데이트/.test(t)) return true;
      if (id === "family" && /가족|아이|유모차|키즈/.test(t)) return true;
      if (id === "first_timer" && /첫|처음|입국|초행/.test(t)) return true;
      if (id === "returning_visitor" && /재방|다시|두번째|리피트/.test(t)) return true;
      if (id === "photo_spot_lover" && /사진|포토|인생샷|필수/.test(t)) return true;
      if (id === "slow_pace_traveler" && /천천히|느긋|여유/.test(t)) return true;
      if (id === "practical_traveler" && /실속|효율|팁|주의|규정/.test(t)) return true;
      return false;
    },
    ["first_timer", "practical_traveler"],
  );

  const duration = pick(
    [...POST_META_DURATION_IDS],
    (id) => {
      if (id === "one_hour" && /1시간|한시간|약 한시간/.test(t)) return true;
      if (id === "half_day" && /반나절|오전|오후/.test(t)) return true;
      if (id === "one_day" && /하루|종일|풀데이/.test(t)) return true;
      if (id === "one_to_two_days" && /이틀|1~2|1-2/.test(t)) return true;
      if (id === "first_day_good" && /첫날|첫째날|도착일/.test(t)) return true;
      if (id === "last_day_good" && /마지막|출발 전|귀국 전/.test(t)) return true;
      return false;
    },
    ["half_day"],
  );

  const mobility = pick(
    [...POST_META_MOBILITY_IDS],
    (id) => {
      if (id === "walking" && /도보|걸어|walking/.test(t)) return true;
      if (id === "transit" && /지하철|버스|환승|대중교통/.test(t)) return true;
      if (id === "taxi_ok" && /택시|uber|우버/.test(t)) return true;
      if (id === "low_mobility_load" && /가깝|짧|왕복/.test(t)) return true;
      if (id === "medium_mobility_load" && /이동|구간|스팟/.test(t)) return true;
      if (id === "easy_navigation" && /길|찾기|내비|표지판/.test(t)) return true;
      return false;
    },
    ["walking", "easy_navigation"],
  );

  const mood = pick(
    [...POST_META_MOOD_IDS],
    (id) => {
      if (id === "k_culture" && /k-?컬처|한복|궁|전통/.test(t)) return true;
      if (id === "seoul_night_scene" && /야경|밤|넥타|한강 밤/.test(t)) return true;
      if (id === "cafe_focused" && /카페|브런치|디저트/.test(t)) return true;
      if (id === "local_vibe" && /로컬|동네|숨은/.test(t)) return true;
      if (id === "quiet_route" && /한적|조용|여유/.test(t)) return true;
      if (id === "practical_tip" && /팁|주의|규정|실전/.test(t)) return true;
      if (id === "photo_spot" && /포토|사진|전망/.test(t)) return true;
      return false;
    },
    ["local_vibe", "practical_tip"],
  );

  const titleShort = post.title.trim().slice(0, 42);
  const sum = post.summary.trim();

  const summaryOpts = uniq([
    sum.length > 60 ? `${sum.slice(0, 58)}…` : sum,
    `${titleShort} — 동선과 팁을 한 번에`,
    `짧은 시간에 부담 없이 즐기기 좋은 ${titleShort}`,
  ]).slice(0, 3);

  const reasonOpts = uniq([
    "도보·이동 설명이 반복되어 도보 동선으로 분류했어요.",
    "스팟 구성이 짧은 구간 위주라 반나절 일정으로 추천했어요.",
    "실용 팁과 주의 문구가 많아 ‘실용 팁’ 무드를 함께 넣었어요.",
  ]).slice(0, 3);

  const bestForOpts = uniq([
    "첫 방문자가 방향을 잡기 좋은 구성이에요.",
    "사진·기념 컷을 챙기려는 여행자에게 맞춰 보세요.",
    "이동 부담을 줄이고 핵심만 보고 싶을 때 좋아요.",
  ]).slice(0, 3);

  let hero: PostMetaAiSuggestionDraft["hero_subject_suggested"] = "mixed";
  if (/인물|만남|가이드|얼굴|모델/.test(t)) hero = "person";
  else if (/전망|야경|광장|궁|거리|카페 거리/.test(t)) hero = "place";

  const why: string[] = [];
  if (/혼자|솔로|도보/.test(t)) {
    why.push("본문에 혼자 이동·도보 흐름이 보여 solo / walking 계열을 추천했어요.");
  }
  if ((post.route_journey?.spots.length ?? 0) >= 2 && /반나절|짧|코스/.test(t)) {
    why.push("스팟이 이어진 짧은 동선이라 half_day 쪽 일정 태그를 제안했어요.");
  }
  if (/팁|주의|규정|실전/.test(t)) {
    why.push("실행 가능한 문장이 많아 practical_tip·실속 여행자 태그를 포함했어요.");
  }
  if (why.length === 0) {
    why.push("제목·요약·본문 키워드를 기준으로 여행자·일정·이동 성격을 가볍게 맞춰 보았어요.");
  }

  return {
    audience_tags_suggested: audience,
    duration_tags_suggested: duration,
    mobility_tags_suggested: mobility,
    mood_tags_suggested: mood,
    summary_card_suggested: summaryOpts,
    reason_line_suggested: reasonOpts,
    best_for_context_suggested: bestForOpts,
    hero_subject_suggested: hero,
    why_suggested: why.slice(0, 3),
  };
}

/** 나중에 `POST /api/.../ai-meta` 등으로 교체 */
export async function fetchPostMetaAiSuggestion(post: ContentPost): Promise<PostMetaAiSuggestionDraft> {
  await new Promise((r) => setTimeout(r, 380));
  return mockPostMetaSuggestion(post);
}
