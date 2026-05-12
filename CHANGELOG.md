# Changelog

## Unreleased — branch `claude/cool-davinci-38d3a9`

### Fixed
- **`/api/threads` 슬러그 입력 시 500** (PG 22P02). 가디언 식별자 정규화로 uuid·슬러그 모두 수용.
- **가디언 프로필 "이 하루이의 하루웨이" 항상 빈 상태**. uuid/슬러그 비대칭으로 mock 포스트 매칭 실패 → DB+mock 양쪽을 모두 검사하는 헬퍼로 교체.
- **inquiry 시트 입력/칩이 영구 disabled**. `threadError` 분기 + retry 패널 + 입력바 숨김으로 교체.

### Added
- `guardian_profiles.last_seen_at timestamptz` 컬럼 + index (5분 임계 온라인 판정).
- `src/lib/guardian-id-normalize.server.ts` — `normalizeGuardianRef()`.
- `src/lib/guardian-online.ts` — `isGuardianOnline()` (5분) + `isInquireNowOnProfileEnabled()`.
- `src/lib/posts-public-merged.server.ts` — `listPostsForGuardianByAnyRefMerged(refs)`.
- `src/lib/dev/mock-guardian-auth.ts` — `resolveSlugFromMockGuardianUuid(uuid)`.
- 가디언 프로필 hero 온라인 배지, aside "지금 문의하기" (flag), sticky mobile CTA.
- 가디언 목록·저장한 하루이에 온라인 배지 + "지금 문의하기".

### Feature flags
- `NEXT_PUBLIC_INQUIRE_NOW_ON_PROFILE` (기본 `"1"`). `"0"` 설정 시 프로필 aside의 "지금 문의하기" 버튼만 숨김. 정규화·하루웨이 채움은 무조건 활성(버그 수정).

## Chat UX overhaul (PR-F → PR-I)

### Fixed
- **칩 클릭 시 메시지 2번 입력** — `messages.client_msg_id` 도입, Realtime + 낙관 dedup 통합.
- **하루이가 새 메시지 받았는지 모름** — `/api/notifications/unread` + 헤더 메신저 아이콘(빨간 카운트 배지) + LNB 메시지함 항목.
- **인박스 진입 경로 없음** — LNB(여행자·하루이 각자), 헤더 아이콘.
- **여행자별 채팅 목록 미식별** — `/api/threads` 응답에 `other`(이름·아바타·역할·last_seen) 조인, `last_message_preview`, `unread_count`.
- **시작 포스트가 어느 것인지 모름** — `message_threads.source_post_id` 컬럼 + 시트/인박스 헤더에 "📍 {포스트 제목}" 칩.

### Added
- `messages.client_msg_id text` + unique partial idx `(thread_id, client_msg_id)`.
- `message_threads.source_post_id uuid → content_posts(id)` + idx.
- `GET /api/notifications/unread`.
- `src/components/layout/header-inbox-button.tsx` — 60초 폴링.
- LNB i18n: `guardianNavMessages` (ko/en).
- 인박스 행 UX: 아바타·온라인 점·이름·포스트 칩·미리보기·시간·미확인 배지.

### Idempotency
- `POST /api/threads/[id]/messages` — `client_msg_id` 중복 시 200 `deduped: true` 반환 (재전송 안전).

## Realtime + Toast + Sound + Web Push (PR-J → PR-M)

### Added — instant notification UX
- **PR-J Header Realtime**: HeaderInboxButton 이 Supabase Realtime로 `messages INSERT` 구독 → 새 메시지 도착 시 수 초 내 빨간 배지 + 토스트.
- **PR-K Inbox Realtime**: ThreadListClient 가 인박스 목록을 Realtime 패치 → 행이 실시간으로 상단 이동, preview/unread/시간 즉시 갱신, 신규 스레드는 자동 fetch.
- **PR-L Toast + Sound + Desktop**:
  - `<ToastProvider>` locale 레이아웃에 마운트.
  - `<InboundNotifyBridge />` 가 `safemate:inbound-message` 이벤트 수신 → 토스트 + Web Audio 비프 + OS 데스크톱 알림.
  - 사용자 설정: `localStorage.safemate.notif.sound`, `safemate.notif.desktop`.
- **PR-M Web Push**:
  - `user_push_subscriptions` 테이블 + RLS (own select/insert/delete).
  - `public/sw.js` Service Worker (push + notificationclick).
  - `<PushSubscriptionAutoSubscribe />` 가 첫 인터랙션 후 SW 등록 + 권한 + pushManager.subscribe.
  - `/api/notifications/push/subscribe` 멱등 upsert (endpoint unique).
  - `/api/notifications/push/unsubscribe`.
  - `sendInboundMessagePush()` → `/api/threads/[id]/messages` POST 후 호출.
  - VAPID 키 미설정 시 silent skip (dev/local 호환).
- Dependencies: `web-push@3.6.7` + `@types/web-push`.

### Env vars required (PR-M only)
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (메일 형식 권장)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (클라이언트 — 공개 키와 동일)

VAPID 키 생성:
```bash
npx web-push generate-vapid-keys
```
미설정해도 build/dev/runtime 정상 — 푸시 전송만 silent skip.

## Rollback

DB:
```sql
-- last_seen_at
drop index if exists public.guardian_profiles_last_seen_idx;
alter table public.guardian_profiles drop column if exists last_seen_at;
-- chat dedup + source_post
drop index if exists public.messages_client_msg_id_uidx;
alter table public.messages drop column if exists client_msg_id;
drop index if exists public.message_threads_source_post_idx;
alter table public.message_threads drop column if exists source_post_id;
-- web push subscriptions
drop table if exists public.user_push_subscriptions;
```

코드: `git revert <commit-sha>` (각 PR 단위 reversible).
