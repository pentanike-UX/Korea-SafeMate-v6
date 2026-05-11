# Phase 0 — INVESTIGATION

대상: 가디언 프로필 빈 "하루웨이" 섹션 / 포스트 상세의 비활성 문의 패널 / 프로필에 누락된 온라인·문의 진입점.
브랜치: `claude/cool-davinci-38d3a9` (이미 일부 UI 패치를 시도 — main에는 미반영).

## 1. 관련 파일 (책임 1~2줄 요약)

### 라우트 / 페이지
| 경로 | 책임 |
|---|---|
| [src/app/[locale]/(public)/guardians/[guardianId]/page.tsx](src/app/%5Blocale%5D/%28public%29/guardians/%5BguardianId%5D/page.tsx) | 가디언 상세 페이지 entry. `getPublicGuardianByIdMerged()` 호출 후 `<GuardianDetailView>` 렌더. |
| [src/app/[locale]/(public)/posts/[postId]/page.tsx](src/app/%5Blocale%5D/%28public%29/posts/%5BpostId%5D/page.tsx) | 포스트 상세 entry. `post-detail-view` / `route-post-detail-view` 분기. |
| [src/app/api/threads/route.ts](src/app/api/threads/route.ts) | `POST` pre_booking thread upsert / `GET` 내 스레드 목록. **현 시점 `guardian_user_id`만 받고 uuid 정규화 없음.** |
| [src/app/api/threads/[id]/messages/route.ts](src/app/api/threads/%5Bid%5D/messages/route.ts) | 스레드 메시지 CRUD. |

### 컴포넌트
| 경로 | 책임 |
|---|---|
| [src/components/guardians/guardian-detail-view.tsx](src/components/guardians/guardian-detail-view.tsx) | 가디언 상세 본문. hero에 온라인 배지(155L), aside에 "지금 문의하기"(420L) — **이 브랜치에서만 존재**. "하루웨이" 섹션은 [313L](src/components/guardians/guardian-detail-view.tsx:313): `insightPosts.length===0` 시 `t("noPosts")`. |
| [src/components/guardians/guardian-inquiry-sheet.tsx](src/components/guardians/guardian-inquiry-sheet.tsx) | 전역 이벤트 `safemate:open-guardian-inquiry`로 열리는 채팅형 문의 시트. **`POST /api/threads`에 `{guardian_user_id: d.guardianUserId}` 그대로 전송** (102L). 실패하면 `threadId` 미세팅 → textarea/Send 모두 `disabled` (390/397L). 칩도 `sendMessage(q)`가 `threadId` 가드(180L)에서 막힘. |
| [src/components/guardians/guardian-request-defaults-publisher.tsx](src/components/guardians/guardian-request-defaults-publisher.tsx) | 페이지 진입 시 `GUARDIAN_REQUEST_DEFAULTS_EVENT`로 가디언 기본값 publish (포스트 페이지에서 사용). |
| [src/components/guardians/guardians-discover-client.tsx](src/components/guardians/guardians-discover-client.tsx) | 가디언 목록(이 브랜치에서 온라인 배지 + 문의 버튼 추가). |
| [src/components/guardians/guardian-sticky-cta.tsx](src/components/guardians/guardian-sticky-cta.tsx) | 모바일 하단 sticky CTA. 이 브랜치에서 "지금 문의하기" + "요청하기" 2-grid로 갱신. |
| [src/components/posts/post-detail-view.tsx](src/components/posts/post-detail-view.tsx) [route-post-detail-view.tsx](src/components/posts/route-post-detail-view.tsx) | 포스트 상세. `<GuardianRequestDefaultsPublisher guardianUserId={post.author_user_id}>` 로 전역 가디언 기본값 publish. **`author_user_id`는 시드일 경우 슬러그("mg14") 또는 deterministic uuid**. |

### 라이브러리
| 경로 | 책임 |
|---|---|
| [src/lib/guardian-public-merged.server.ts](src/lib/guardian-public-merged.server.ts) | DB+mock 병합. `getPublicGuardianByIdMerged(userId)`는 uuid 또는 `seed_guardian_key` 둘 다로 조회 (144–153L) — **이 브랜치에서 직전 수정**. |
| [src/lib/posts-public.ts](src/lib/posts-public.ts) | `listPostsForGuardian(authorUserId)` — `mockContentPosts`만 본다 (DB 미사용). |
| [src/lib/posts-public-merged.server.ts](src/lib/posts-public-merged.server.ts) | DB+mock 포스트 병합 (대표 포스트 배치 조회용). |
| [src/lib/guardian-representative-post-context.ts](src/lib/guardian-representative-post-context.ts) | `representative_post_ids`로 대표 포스트 해석. **DB-로딩 가디언의 경우 `representative_post_ids`가 어떻게 채워지는지가 핵심.** |
| [src/lib/guardian-public.ts](src/lib/guardian-public.ts) | `mergePublicGuardian()` — `mockGuardianMarketingById[g.user_id]`로 마케팅(=대표 포스트 ids)을 합친다. **mock은 `mg14` 슬러그로 키링**. DB 가디언의 `user_id`가 uuid면 lookup 실패 → `defaultMarketingFromGuardian` 폴백. |
| [src/lib/dev/mock-guardian-auth.ts](src/lib/dev/mock-guardian-auth.ts) | `defaultMarketingFromGuardian()` 113L: `representative_post_ids: repIds.slice(0,3)` — repIds 출처를 후속 단계에서 정확히 확인 필요. |
| [src/lib/seed/deterministic-uuid.ts](src/lib/seed/deterministic-uuid.ts) | `seedGuardianUserUuid("mg14")` → 결정적 v5 uuid. **이게 DB `users.id` / `guardian_profiles.user_id`**. |
| [src/lib/seed/map-seed-to-db-rows.ts](src/lib/seed/map-seed-to-db-rows.ts) | `resolveGuardianUserIdForSeed()` — uuid면 그대로, 슬러그면 v5 uuid로 매핑. **이미 정규화 헬퍼는 존재**. |

### 데이터베이스 / 마이그레이션
| 파일 | 내용 |
|---|---|
| [supabase/migrations/20260201000000_initial_public_schema.sql:170](supabase/migrations/20260201000000_initial_public_schema.sql:170) | `guardian_profiles.seed_guardian_key text` + unique idx. |
| [supabase/migrations/20260401000013_create_message_threads_messages.sql:6](supabase/migrations/20260401000013_create_message_threads_messages.sql:6) | `message_threads.guardian_user_id uuid not null references public.users(id)`. **여기서 슬러그를 받으면 PG 22P02.** |
| [supabase/migrations/20260511000001_chat_v2_schema.sql](supabase/migrations/20260511000001_chat_v2_schema.sql) | `inquiry_kind`, pre_booking unique index, RLS insert/update 정책. |
| [supabase/migrations/20260201000000_initial_public_schema.sql:101](supabase/migrations/20260201000000_initial_public_schema.sql:101) | `content_posts.author_user_id uuid not null references public.users(id)`. **DB에 들어간 시드 포스트는 author가 uuid (확정)**. |

## 2. 식별자 체계 (관측 + 추정)

```
시드 슬러그           ↔  deterministic v5 uuid                          ↔ DB 행
"mg14" (mock)            seedGuardianUserUuid("mg14")
                          = e1c15fda-0462-5000-a5df-961ca128dc7d           guardian_profiles.user_id = <uuid>
                                                                            guardian_profiles.seed_guardian_key = "mg14"
"seed-mg14-ap-04" (mock) seedContentPostUuid("seed-mg14-ap-04")            content_posts.id = <uuid>
                                                                            content_posts.author_user_id = <mg14 uuid>
                                                                            content_posts.seed_content_key = "seed-mg14-ap-04"
```

- **프로필 URL** `/ko/guardians/e1c15fda-…`: DB의 uuid → `getPublicGuardianByIdMerged(uuid)` → `byUid` 적중 → `g.user_id = <uuid>`.
- **포스트 URL** `/ko/posts/seed-mg14-ap-04`: 슬러그(seed_content_key)로 진입 → `post.author_user_id` = ? **확정 필요**:
  - DB-경유면 uuid.
  - mock-경유면 가능성 둘 다 있음 (mockContentPosts 검사 필요 — Phase 1에서 확인).

## 3. 결함 — 표면 증상 vs 짚어둔 코드 위치

### 결함 ① 포스트 상세 "지금 문의하기" → 입력/칩 모두 disabled
- 진입 시 [inquiry-sheet:102](src/components/guardians/guardian-inquiry-sheet.tsx:102): `POST /api/threads { guardian_user_id: d.guardianUserId }`.
- `d.guardianUserId`는 publisher가 publish한 `post.author_user_id`. **포스트가 mock-only이고 슬러그("mg14")로 저장되어 있으면 곧장 슬러그가 API로 감.**
- [threads/route.ts:44](src/app/api/threads/route.ts:44): `insert({ guardian_user_id: body.guardian_user_id, ... })` → uuid 컬럼 → `22P02 invalid input syntax for type uuid: "mg14"` → 500.
- 클라이언트 [inquiry-sheet:111](src/components/guardians/guardian-inquiry-sheet.tsx:111): `!res.ok → throw`. catch에서 welcome 더미만 push, `threadId`는 null인 채로 두고 `setIsLoading(false)` → textarea의 `disabled={isSending || isLoading || !threadId}` 중 **`!threadId`가 true** → 영구 비활성.
- 칩도 [sendMessage:180](src/components/guardians/guardian-inquiry-sheet.tsx:180)에서 `if (!threadId) return` → no-op.

### 결함 ② 가디언 프로필 "이 하루이의 하루웨이" 항상 empty
- [guardian-detail-view.tsx:65](src/components/guardians/guardian-detail-view.tsx:65): `resolveRepresentativeContentPosts(g, mockContentPosts, 3)`.
- DB-로딩 가디언(`g.user_id = uuid`) → `mockGuardianMarketingById[uuid]`는 **null** (mock 키는 슬러그) → `defaultMarketingFromGuardian` 폴백 → `representative_post_ids`가 mock에서 채워진 값과 다를 수 있음.
- 더 결정적: `mockContentPosts`에 들어있는 포스트의 id는 슬러그("seed-mg14-ap-04") — 폴백이 만약 슬러그 id를 채우더라도 `find((x) => x.id === id)`는 mock 카탈로그에서 동작. 그러나 mock 카탈로그에 해당 id가 없거나 representative_post_ids가 비면 0건. **현실: 모든 DB 가디언 프로필에서 0건이 일관적으로 발생** — 즉 폴백 경로가 빈 배열을 만들고 있음.
- 해결 경로: `mockContentPosts`만 보지 말고, DB에서 가디언별 승인 포스트를 가져와야 함. `getLatestApprovedPostsForGuardiansMergedBatch`/`listApprovedPostsByIdsMerged`는 이미 존재 — 마이페이지 saved-guardians에서 사용 중.

### 결함 ③ 가디언 프로필에 온라인/문의 진입점 부재
- 프로덕션(main) 기준: 미존재. 본 브랜치에서 hero 배지(155L) + aside "지금 문의하기"(420L)는 추가됨.
- 다만 ①번이 미해결이라 이 브랜치가 그대로 머지돼도 버튼은 disabled로 끝남.

## 4. 가설(다음 단계에서 검증)

- **H1**: DB의 모든 시드 포스트는 `author_user_id`가 uuid이지만, **mock-only 포스트는 슬러그**이고 `/ko/posts/seed-mg14-ap-04`는 mock-only일 가능성이 높음. → 그래서 publisher가 슬러그를 publish함.
- **H2**: `representative_post_ids` 폴백이 슬러그 id를 만들지만, posts 카탈로그 매칭에서 0건 → "하루웨이" 빈 상태.
- **H3**: `last_seen_at` 컬럼은 `guardian_profiles`에 존재하는지 미확인. mock은 `"mock:online"` sentinel 사용. **DB 컬럼 존재 확인 필요** (Phase 1).

## 5. Phase 1로 가져갈 확인 항목 (RCA에서 결정짓는다)

- [ ] `mockContentPosts`에서 `seed-mg14-ap-04`의 `author_user_id` 값 정확히 확인.
- [ ] `guardian_profiles.last_seen_at` 컬럼 존재 여부 (마이그레이션 grep).
- [ ] DB에 시드된 가디언 행 수, `seed_guardian_key`가 채워져 있는지 (Supabase MCP 가능).
- [ ] `representative_post_ids` 폴백이 0건이 되는 정확한 코드 라인.
- [ ] 동일 가디언에 두 진입점(프로필/포스트)에서 publish되는 `guardianUserId` 값이 실제로 다른지 (이론상 다름 — uuid vs slug).

## 6. QUESTIONS (임의 결정 회피 — 답 후 진행)

1. **정책**: `posts.author_user_id`(=`content_posts.author_user_id`)는 현재 schema상 `uuid not null FK → users(id)`. 이미 uuid 정합성이 강제됨. → **mock-only 포스트는 결국 DB에 들어가지 않으므로 production에서는 슬러그 author는 존재할 수 없음.** 그렇다면 production에서 `/posts/seed-mg14-ap-04`가 보인다는 것은 **mock 라우트가 SSR에서 그대로 렌더되고 있다**는 뜻. (a) mock 포스트도 시드로 DB에 넣어 통일, (b) mock 라우트에서는 publisher가 슬러그→uuid 매핑 후 publish, 둘 중 어느 쪽이 정책에 맞을지 결정 필요.

2. **클라이언트 계약 변경 범위**: 프롬프트의 DESIGN에선 `POST /api/threads { guardian_ref }`로 키를 바꾸자고 함. 그러나 `inquiry-sheet.tsx`는 이미 `{ guardian_user_id }`. 호환성을 위해 (a) 새 키 `guardian_ref` 단독 채택 + UI 동시 갱신, (b) `guardian_user_id`도 계속 받되 내부에서 정규화 — 둘 중 어느 쪽?

3. **온라인 판정 임계값**: 프롬프트는 5분, 현재 mock은 30분(`Date.now() - last_seen < 30 * 60 * 1000`). 5분 채택?

4. **feature flag**: 프롬프트는 `NEXT_PUBLIC_INQUIRE_NOW_ON_PROFILE`만 명시. ②(하루웨이 채우기)와 ①(threads 정규화)도 플래그 뒤에 둘지, 아니면 무조건 켜고 갈지?

5. **본 브랜치 변경분의 운명**: 이 브랜치에는 이미 hero 온라인 배지/aside 문의 버튼/sticky CTA/saved-guardians/discover-list 패치가 들어있음. PR-C가 이 브랜치 위에 쌓이는지, 아니면 새 깨끗한 브랜치에서 다시 시작할지?

---

**다음 단계 대기:** 위 5개 QUESTIONS에 답해 주시거나 "그대로 진행" 지시 주시면 Phase 1(RCA.md → DESIGN.md)을 출력합니다.
