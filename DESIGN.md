# Phase 2 — Design

## 0. 결정 사항 (Q&A 정리)

| Q | 결정 | 비고 |
|---|---|---|
| Mock-only 포스트 처리 | **서버 정규화 + repIds DB 폴백** (b) | mock 데이터 보존, DB 시드는 그대로 |
| API 계약 변경 범위 | **`guardian_user_id` 키 유지 + 서버 정규화** (b) | 후방 호환, UI 일괄 변경 회피 |
| 온라인 임계값 | **5분** | 30분(mock) → 5분으로 통일 |
| Feature flag | `NEXT_PUBLIC_INQUIRE_NOW_ON_PROFILE`만 사용 | 정규화·하루웨이는 무조건 활성(버그 수정) |
| 베이스 브랜치 | `claude/cool-davinci-38d3a9` 위에 PR-A/B/C 누적 | 기존 UI 패치 보존 |

## 1. 데이터 모델

### 1.1 신규 컬럼

```sql
-- guardian_profiles.last_seen_at (없음 → 추가)
alter table public.guardian_profiles
  add column if not exists last_seen_at timestamptz;
create index if not exists guardian_profiles_last_seen_idx
  on public.guardian_profiles (last_seen_at desc nulls last);
```

- `seed_guardian_key` 컬럼은 **이미 존재** ([initial:170](supabase/migrations/20260201000000_initial_public_schema.sql:170)). 추가 작업 없음.
- `posts.guardian_user_id`는 본 프로젝트에 없음 (포스트는 `author_user_id`이고 이미 uuid FK). **backfill 불필요**.

### 1.2 정규화 헬퍼 (서버 전용)

`src/lib/guardian-id-normalize.server.ts` (신규):

```ts
import { isUuidString } from "@/lib/guardian-posts-api";
import { MOCK_GUARDIAN_UUID_MAP } from "@/lib/dev/mock-guardian-auth";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/**
 * 가디언 식별자 정규화: uuid 그대로 통과, 슬러그면 (1) MOCK_GUARDIAN_UUID_MAP 즉시,
 * (2) guardian_profiles.seed_guardian_key 조회.
 * 반환: { uuid: string } | { error: "not_found" | "invalid" }.
 */
export async function normalizeGuardianRef(ref: string): Promise<
  | { ok: true; uuid: string; source: "uuid" | "mock_map" | "db_seed" }
  | { ok: false; reason: "invalid" | "not_found" }
> {
  const t = ref?.trim();
  if (!t) return { ok: false, reason: "invalid" };
  if (isUuidString(t)) return { ok: true, uuid: t, source: "uuid" };
  const mapped = MOCK_GUARDIAN_UUID_MAP[t];
  if (mapped) return { ok: true, uuid: mapped, source: "mock_map" };
  const sb = createServiceRoleSupabase();
  if (!sb) return { ok: false, reason: "not_found" };
  const { data } = await sb
    .from("guardian_profiles")
    .select("user_id")
    .eq("seed_guardian_key", t)
    .maybeSingle();
  if (!data?.user_id) return { ok: false, reason: "not_found" };
  return { ok: true, uuid: data.user_id as string, source: "db_seed" };
}
```

## 2. API 계약

### 2.1 `POST /api/threads`

요청(둘 다 허용):
```jsonc
{ "guardian_user_id": "<uuid|slug>" }
```

응답:
- 201 `{ thread, created: true }` — 신규
- 200 `{ thread, created: false }` — 기존
- 400 `{ error: "guardian_user_id required" | "Invalid JSON" }`
- 404 `{ error: "guardian_not_found" }` — 정규화 실패
- 401 `{ error: "Unauthorized" }`
- 500 `{ error: <db_message> }`

내부 흐름:
```
body.guardian_user_id → normalizeGuardianRef() → uuid → 기존 로직
                                                ↘ ok=false → 404
```

기존 응답 형식 유지 (호환성). `{ok,data}` 형식 통일 권고는 **이번 PR 범위 외** (다른 API와 일관성 깨짐 회피).

### 2.2 `POST /api/threads/[id]/messages`

변경 없음 (thread.id는 이미 uuid, FK).

### 2.3 (선택) `POST /api/guardians/presence`

가디언이 인증된 상태에서 heartbeat:
```jsonc
// POST /api/guardians/presence  (auth required)
// body: 없음
// effect: guardian_profiles.last_seen_at = now() where user_id = auth.uid()
// response: { ok: true, last_seen_at }
```

호출 지점: `/guardian` 대시보드 + 가디언 워크스페이스 진입 시 최초 1회 + 5분 throttle. **PR-D(추후)로 분리 가능 — MVP에선 mock 가디언 로그인 라우트에서 한 번 upsert**.

## 3. 프레즌스 정책

- `guardian_profiles.last_seen_at` 단일 소스.
- 판정: `last_seen_at && (Date.now() - new Date(last_seen_at).getTime()) < 5 * 60 * 1000`.
- mock 센티넬 `"mock:online"` 호환 유지 (mockGuardians만 사용).
- 컴포넌트: 단일 헬퍼 `isGuardianOnline(g)` (`src/lib/guardian-online.ts`). 모든 배지/CTA가 이 헬퍼 사용.
- Realtime presence 채널 업그레이드는 인터페이스만 호환되도록 분리(추후).

## 4. UI 변경

### 4.1 가디언 프로필 ([guardian-detail-view.tsx](src/components/guardians/guardian-detail-view.tsx))

| 위치 | 변경 |
|---|---|
| `insightPosts` 산출 | `resolveRepresentativeContentPosts(g, mockContentPosts, 3)` → **`listPostsForGuardianMerged(g.user_id)` + repIds 우선순위 정렬 + `mockContentPosts` fallback** |
| hero 온라인 배지 | 기존 30분 임계값 → `isGuardianOnline(g)` (5분) |
| aside "지금 문의하기" | 이미 추가됨. publisher는 `g.user_id`(=uuid) 전달이라 ①과 무관 — 본 페이지에서는 잘 동작 |
| feature flag | aside·hero·sticky 모두 `process.env.NEXT_PUBLIC_INQUIRE_NOW_ON_PROFILE !== "0"` 일 때 노출 (기본 ON) |

### 4.2 포스트 상세 publisher

`<GuardianRequestDefaultsPublisher guardianUserId={post.author_user_id}>` 그대로 두되, **mock-only일 때 `post.author_user_id`가 슬러그**여도 OK — 서버 정규화가 해결. UI 변경 0.

### 4.3 Inquiry 시트 에러 UX ([guardian-inquiry-sheet.tsx](src/components/guardians/guardian-inquiry-sheet.tsx))

| 상태 | 변경 |
|---|---|
| `POST /api/threads` 실패 | 현재: welcome 더미만, textarea disabled. → **인라인 에러 패널 + "다시 시도" 버튼**. 404일 때는 "가디언을 찾을 수 없어요" 안내. |
| `threadId` null | textarea·send·칩 모두 disabled 유지하되, **칩 클릭 시 retry**. |
| `isLoading` | 기존 disabled 유지. |

```tsx
// 상태 추가
const [threadError, setThreadError] = useState<"not_found" | "network" | null>(null);

// 초기화 시
setThreadError(null);

// 실패 분기
if (res.status === 404) { setThreadError("not_found"); /* welcome push */ }
else if (!res.ok) { setThreadError("network"); /* welcome push */ }

// 재시도 핸들러
const retryThreadInit = async () => { setThreadError(null); /* dispatch open event 재실행 */ };
```

### 4.4 빈 "하루웨이" 안내

데이터 0건일 때만 기존 `t("noPosts")` 노출. 1건 이상이면 정상 list 렌더.

## 5. 에러 UX / 관측성

### 5.1 서버 로그
- `[POST /api/threads]` 정규화 결과(`source`, `uuid`, `result_code`).
- PII·메시지 본문 미로깅.

### 5.2 클라이언트
- 4xx → 사용자에게 인라인 안내 + retry 버튼.
- 5xx → 동일 + Sentry tag(있다면) `inquiry.thread.init.fail`.
- 토스트는 사용 안 함 (시트 안에 인라인이 더 명확).

## 6. PR 분리

### PR-A — 스키마 (last_seen_at 컬럼)
- `supabase/migrations/<ts>_guardian_last_seen_at.sql` (forward + rollback).
- `getPublicGuardianByIdMerged` select에 `last_seen_at` 추가.
- `listPublicGuardiansMerged` select에 `last_seen_at` 추가.
- 타입(`GpRow`)에 필드 추가, `toGuardianProfile`에 매핑.

### PR-B — API 정규화
- 신규: `src/lib/guardian-id-normalize.server.ts` (+ unit test).
- 변경: `src/app/api/threads/route.ts` — POST에서 normalize 호출, 404 분기.
- 변경: `src/app/api/traveler/match-requests/route.ts` (확인 후 동일 패턴 적용 여부) — **본 PR 범위 외, 별도 이슈로**.

### PR-C — UI (하루웨이 채움 + 온라인 헬퍼 + retry UX + flag)
- 신규: `src/lib/guardian-online.ts` (`isGuardianOnline`).
- 신규: `src/components/guardians/inquiry-now-button.tsx` (래퍼) — 기존 `GuardianInquiryOpenTrigger` 재사용, flag 게이트.
- 변경: `guardian-detail-view.tsx` — insightPosts를 DB+mock 병합, online 헬퍼 사용, flag 적용.
- 변경: `guardian-inquiry-sheet.tsx` — threadError state + retry 패널 + 칩 retry.
- 변경: `guardians-discover-client.tsx` / `saved-guardians/page.tsx` / `guardian-sticky-cta.tsx` — 헬퍼 일원화.
- (선택) `defaultMarketingFromGuardian` repIds 폴백 보강 — **선택적, DB 폴백이 더 강해서 빼도 됨**.

## 7. Verification 계획

### 7.1 단위
- `normalizeGuardianRef`:
  - uuid 통과
  - 슬러그 → MOCK_GUARDIAN_UUID_MAP 적중 (예: `mg14` → `2da22c42-…`)
  - 슬러그 → DB seed_guardian_key 적중 (mock 비포함 case는 stub)
  - 미지 슬러그 → `not_found`
  - 빈/공백 → `invalid`
- `isGuardianOnline`:
  - `"mock:online"` → true
  - `now - 4분` → true
  - `now - 5분 1초` → false
  - undefined / null → false

### 7.2 API
- `POST /api/threads` 인증 후:
  - `{guardian_user_id: "mg14"}` → 201 또는 200 (uuid로 정규화)
  - `{guardian_user_id: "<uuid>"}` → 동일
  - `{guardian_user_id: "nope"}` → 404
  - body 누락 → 400

### 7.3 E2E (Playwright)
1. `/ko/posts/seed-mg14-ap-04` → "지금 문의하기" → 칩 "이 루트 동행 가능한가요?" → 사용자 말풍선이 우측에 나타남.
2. `/ko/guardians/<mg13-uuid>` → "이 하루이의 하루웨이"에 카드 ≥1.
3. `/ko/guardians/<mg13-uuid>` → aside "지금 문의하기" → 동일 다이얼로그.
4. `last_seen_at` 모킹: 4분 전 / 6분 전 — 배지 토글 검증.

### 7.4 수동 QA (QA_CHECKLIST.md — Phase 4에서 생성)
- 입력창 활성, Enter 전송, Shift+Enter 줄바꿈, max 500자.
- 다이얼로그 닫고 재오픈 시 같은 thread_id (unique 인덱스 보장).
- 동일 가디언에 두 진입점 동일 thread.
- ko/en 라벨 동기화.
- 다크모드 + 모바일 ≤390px.

## 8. 안전 / 릴리스 (Phase 5에서 자세히)

- Feature flag: `NEXT_PUBLIC_INQUIRE_NOW_ON_PROFILE` 기본 `"1"`. 문제 시 `"0"`으로 즉시 비활성 (배포 unblocking).
- 마이그레이션: forward만 staging에서 1회 dry-run → prod. rollback SQL은 컬럼 drop (데이터 손실 허용 — heartbeat만).
- CHANGELOG.md 항목.

## 9. Acceptance 매핑

| Acceptance | PR | Test |
|---|---|---|
| POST /api/threads slug/uuid 모두 수용 → 201 | B | 7.2 |
| 칩 클릭 → 말풍선 | C | E2E #1 |
| textarea 기본 활성, 로딩만 disabled | C | 수동 + E2E |
| 프로필 하루웨이 채워짐 | C | E2E #2 |
| 프로필 온라인 배지 + 문의 버튼, 다이얼로그 동일 | A+C | E2E #3 + flag |
| 단위/통합/e2e 그린 | A/B/C | 7.x |
| 마이그레이션 forward/rollback 검증 | A | staging |

---

**확인 요청**: 위 설계로 PR-A → PR-B → PR-C 순서로 구현 시작해도 될까요? 또는 수정할 항목이 있다면 알려 주세요.
