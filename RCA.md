# Phase 1 — Root Cause Analysis

## 0. 식별자 체계 (확정)

```
시드 슬러그(mg14)
 ├─ guardians-seed.ts        row.id = "mg14"           ← mockGuardians[i].user_id
 ├─ guardian-seed-posts.ts   author_user_id = row.id   ← mockContentPosts[j].author_user_id (= "mg14")
 ├─ DB users.id              = MOCK_GUARDIAN_UUID_MAP["mg14"]
 │                           = "2da22c42-…" (mg13="e1c15fda-…")
 ├─ DB guardian_profiles     user_id = <uuid>, seed_guardian_key = "mg14"
 └─ DB content_posts         author_user_id = <uuid>, seed_content_key = "seed-mg14-ap-04"
```

매핑 자산은 두 곳에 분산 존재:
- 런타임 코드: [src/lib/dev/mock-guardian-auth.ts:27](src/lib/dev/mock-guardian-auth.ts:27) `MOCK_GUARDIAN_UUID_MAP`.
- DB 컬럼: `guardian_profiles.seed_guardian_key` (unique idx).

## 1. 인과 그래프 (한 그림)

```
[ Root: 슬러그/UUID 식별자가 mock 레이어와 DB 레이어에서 비대칭 ]
                │
        ┌───────┴────────────────────────────────────────────┐
        │                                                    │
        ▼                                                    ▼
[ mockContentPosts.author_user_id = slug ]      [ guardian_profiles.user_id = uuid ]
        │                                                    │
        ▼                                                    ▼
[ /posts/seed-mg14-ap-04 (mock-only) ]          [ /guardians/<uuid> 로딩 ]
  post.author_user_id = "mg14" (slug)             g.user_id = uuid
        │                                                    │
        ▼                                                    ▼
[ GuardianRequestDefaultsPublisher publishes      [ defaultMarketingFromGuardian(g):
   guardianUserId = "mg14" ]                        bundle.posts.filter(p.author_user_id === g.user_id)
        │                                            ↑ slug vs uuid → 0 matches
        ▼                                            → repIds = [] ]
[ Inquiry sheet → POST /api/threads                            │
   body {guardian_user_id: "mg14"} ]                           ▼
        │                                          [ resolveRepresentativeContentPosts → [] ]
        ▼                                                      │
[ threads/route.ts insert → PG 22P02 (uuid) ]                  ▼
        │                                          [ "하루웨이" empty (결함 ②) ]
        ▼
[ 500 → catch → threadId null → textarea·칩 disabled ] (결함 ①)

[ 결함 ③ ] = 결함 ① 미해결 + UI 진입점 부재 ⇒ 본 브랜치에서 UI는 추가됐으나 disabled로 끝남.
```

## 2. 결함별 정밀 RCA

### ① POST /api/threads → 500 → 입력/칩 disabled
- 증상: 다이얼로그 오픈 → `POST /api/threads {guardian_user_id:"mg14"}` → 500 `{error:"invalid input syntax for type uuid: \"mg14\""}` → `threadId` null → [inquiry-sheet:390](src/components/guardians/guardian-inquiry-sheet.tsx:390) `disabled={... || !threadId}` 영구 true.
- 코드 라인:
  - 송신: [inquiry-sheet:99–113](src/components/guardians/guardian-inquiry-sheet.tsx:99) — `guardian_user_id`로 슬러그 그대로 전송.
  - 수신: [api/threads:14–53](src/app/api/threads/route.ts:14) — 정규화 0, 컬럼은 uuid FK([migrations/...000013:6](supabase/migrations/20260401000013_create_message_threads_messages.sql:6)).
  - 에러 처리: [inquiry-sheet:121–135](src/components/guardians/guardian-inquiry-sheet.tsx:121) — catch에서 welcome push만, retry 경로 없음.
- 범위: 모든 mock-only 포스트의 "지금 문의하기" 진입점. DB 포스트는 정상.

### ② 가디언 프로필 "하루웨이" 항상 빈 상태
- 증상: `t("noPosts")` = "아직 대표 포스트를 연결하는 중입니다. ..." 항시 노출.
- 코드 라인:
  - [guardian-detail-view.tsx:65](src/components/guardians/guardian-detail-view.tsx:65) — `resolveRepresentativeContentPosts(g, mockContentPosts, 3)`. mock 카탈로그만 본다.
  - [guardian-detail-view.tsx:313–351](src/components/guardians/guardian-detail-view.tsx:313) — `insightPosts.length === 0` 분기.
  - [dev/mock-guardian-auth.ts:68](src/lib/dev/mock-guardian-auth.ts:68) — `bundle.posts.filter(p.author_user_id === g.user_id)`. DB 가디언의 `g.user_id = uuid`인데 bundle은 slug → 0건 → `repIds = []`.
  - 보조: [guardian-public.ts:17](src/lib/guardian-public.ts:17) — `mockGuardianMarketingById[g.user_id]`도 슬러그 키이므로 DB 가디언에서는 항상 null → `defaultMarketingFromGuardian` 폴백.
- 범위: 모든 DB-로딩 가디언 (즉, 모든 production 가디언 프로필).

### ③ 프로필에 온라인 인디케이터·문의 진입점 부재
- 증상(production / main 기준): hero·aside·sticky 어디에도 "지금 온라인"·"지금 문의하기" 없음.
- 현 브랜치 상태:
  - hero 배지: [guardian-detail-view.tsx:155–165](src/components/guardians/guardian-detail-view.tsx:155) 추가됨.
  - aside 버튼: [guardian-detail-view.tsx:420](src/components/guardians/guardian-detail-view.tsx:420) 추가됨.
  - sticky mobile: [guardian-sticky-cta.tsx](src/components/guardians/guardian-sticky-cta.tsx) 추가됨.
  - 목록·saved도 갱신.
- 잔존 결함: `guardian_profiles.last_seen_at` 컬럼이 마이그레이션에 없음 (`grep last_seen_at supabase/migrations/` 0건) → DB 가디언 `g.last_seen_at = undefined` → 항상 "오프라인". mock 가디언만 `last_seen_at: "mock:online"` 센티넬 설정([guardians-seed.ts:294](src/data/mock/guardians-seed.ts:294)).

## 3. 왜 정규화로 가야 하는가 (표면 패치 거부 이유)

①은 클라이언트에서 슬러그를 uuid로 미리 바꿔주는 패치로도 막을 수 있지만, 같은 슬러그를 다른 호출 경로(`/matches`, `/api/traveler/match-requests`, `/api/threads/[id]/messages` 등)가 또 받게 되면 같은 버그가 N번 재현된다. **정답: 모든 가디언 식별자 입력 경계에서 단 한 곳—API 라우트 진입부—에서 uuid로 정규화**. 클라이언트는 "uuid 또는 slug"를 보내도 안전, DB는 항상 uuid만 본다. 자산은 이미 둘 다 존재(`MOCK_GUARDIAN_UUID_MAP` + `seed_guardian_key`) — 새 컬럼 만들 필요 없음.

②는 결국 같은 식별자 비대칭의 다른 얼굴: "uuid 가디언을 슬러그 포스트 카탈로그에 매칭"하려고 시도하는 게 잘못이다. **정답: 카탈로그 자체를 DB+mock 병합본(`posts-public-merged.server`)으로 갈아끼우고, repIds 폴백을 uuid·slug 양쪽으로 비교**. 마침 batch fetcher가 이미 있음.

③은 ①·②가 해결돼야 의미가 있고, 추가로 `last_seen_at` 컬럼이 있어야 production 가디언에서도 작동한다. **컬럼 추가 + 멤버 가디언 페이지에서 heartbeat upsert**가 최소 변경.

## 4. 영향 범위 / 회귀 위험

| 변경 | 영향 표면 | 회귀 위험 |
|---|---|---|
| `/api/threads` 정규화 | 모든 문의 시트 진입점 | 낮음 — 새 분기만 추가, 기존 uuid 입력 동일 동작 |
| `/api/threads/[id]/messages` | 메시지 전송 | 영향 없음 — thread.id는 이미 uuid |
| 가디언 페이지 posts fetch | 가디언 상세 1개 SSR 라운드 추가 | 낮음 — saved-guardians와 같은 헬퍼 |
| `guardian_profiles.last_seen_at` 컬럼 추가 | DDL only | 매우 낮음 (idempotent) |
| `defaultMarketingFromGuardian` repIds 폴백 보강 | mock 마케팅 폴백 | 낮음 — slug 매칭이 0건일 때만 uuid 매칭 추가 |
| 가디언 last_seen heartbeat | 인증된 가디언 SSR/route 1곳 | 낮음 |

다음: DESIGN.md로 이 결정을 계약·스키마·UI 차원에서 확정.
