# Phase 0~2 — Realtime + Toast + Sound + Web Push (combined)

스코프 4건: 즉시 알림(Realtime), 토스트, 사운드/데스크톱 알림, 웹푸시.

## 1. 정찰 요지

- **Supabase Realtime**: `messages` 테이블은 이미 publication 등록 완료 (`chat_v2_schema.sql:49`). 추가 인프라 필요 없음 — 채널만 더 만들면 됨.
- **Toast 컴포넌트**: [src/components/ui/toast.tsx](src/components/ui/toast.tsx) 이미 존재하지만 **ToastProvider가 어디에도 마운트 X**. 사용 가능하지만 활성화 필요.
- **Web Push 인프라**: 0. SW 없음, `web-push` 패키지 없음, VAPID 키 없음, 구독 테이블 없음. 신규 구축.

## 2. PR 분리

### PR-J — Header Realtime (즉시 알림)
- `HeaderInboxButton`에 `useSupabaseRealtime` 추가:
  - 채널 `user-notif:{userId}` (Supabase가 자동 채널명 분리; RLS는 이미 messages_participants 정책으로 본인 참여 스레드만 통과).
  - Postgres `INSERT` on `messages` 구독 (no filter — RLS가 필터링).
  - 콜백: `sender_user_id !== me && is_read === false` 이면 (1) `loadUnread()` 즉시 호출, (2) `playInboundNotification(msg)` 호출.
- 60s 폴링은 백업으로 유지.
- 결과: **수 초 내 배지 + 토스트** (Realtime SLA).

### PR-K — Inbox List Realtime
- `ThreadListClient`에 동일 채널 구독:
  - INSERT 수신 → 해당 thread row를 setState로 부분 갱신:
    - `last_message_preview`, `last_message_at`, `last_message_role`, `last_message_is_ai`
    - `unread_count += 1` (해당 스레드가 현재 선택된 행이 아닐 때만)
  - 정렬 재계산.
  - 미존재 스레드(신규)이면 `/api/threads` 1회 재fetch.

### PR-L — Toast + Sound + Desktop Notification
- `<ToastProvider>` 를 `src/app/[locale]/layout.tsx` 또는 root에 마운트.
- `src/lib/inbound-notify.ts` (신규):
  - `playInboundNotification(msg)`:
    1. 토스트 호출 (`useToast`) — 라우터 컴포넌트에서 호출 가능하도록 hook 형태.
    2. 사운드 재생 (`/public/sounds/inbound.mp3` — 짧은 알림음, 사용자 첫 인터랙션 후 가능).
    3. 데스크톱 Notification (권한 동의 시).
- 사용자 설정 토글:
  - `localStorage.notif.sound = "1"|"0"` (기본 ON)
  - `localStorage.notif.desktop = "auto"|"on"|"off"` (기본 auto: 권한 동의 후 ON)
  - 설정 위치: 인박스 헤더의 작은 아이콘(추후) — MVP에선 자동 OFF 토글만 노출하지 않고 기본값 사용.
- 권한 요청: 사용자가 처음 인박스에 들어왔을 때 1회만 부드럽게 요청.

### PR-M — Web Push (FCM/VAPID)
- 의존성: `web-push`(Node) + `idb-keyval`(SW 캐시 — 선택).
- 신규 마이그레이션:
  ```sql
  create table public.user_push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    user_agent text,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
  );
  create index user_push_subscriptions_user_idx on public.user_push_subscriptions(user_id);
  alter table public.user_push_subscriptions enable row level security;
  create policy "push_own_select" on public.user_push_subscriptions
    for select using (user_id = auth.uid());
  create policy "push_own_insert" on public.user_push_subscriptions
    for insert with check (user_id = auth.uid());
  create policy "push_own_delete" on public.user_push_subscriptions
    for delete using (user_id = auth.uid());
  ```
- VAPID 키: 환경변수 `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (메일).
- 신규 파일:
  - `public/sw.js` — Push 이벤트 + click 핸들러.
  - `src/lib/push-client.ts` — SW 등록 + 구독 함수.
  - `src/app/api/notifications/push/subscribe/route.ts` — POST 구독 저장.
  - `src/app/api/notifications/push/unsubscribe/route.ts` — DELETE 구독 해제.
  - `src/lib/push-server.ts` — `sendInboundMessagePush(toUserId, payload)` (web-push).
- 트리거: `/api/threads/[id]/messages` POST에서 INSERT 성공 후 `void sendInboundMessagePush(otherUserId, {...})` (waitUntil 가능).
- UI: 권한 요청은 PR-L과 같은 흐름 (Notification.requestPermission 후 푸시 구독). 별도 토글 추후.
- 안전: VAPID 키 미설정이면 silent skip (build/dev에서 동작).

## 3. 검증

- PR-J: 두 브라우저로 로그인(여행자/하루이) → 여행자가 메시지 → 하루이 헤더 배지 **수초 내** 증가 + 토스트.
- PR-K: 하루이가 인박스 목록에 있을 때 → 새 메시지 → 목록 행이 자동 위로 이동 + preview 갱신.
- PR-L: 사운드 들림 + 데스크톱 OS 알림.
- PR-M: 브라우저 비활성 또는 다른 도메인으로 이동한 상태에서도 OS 푸시 알림 도착.

## 4. PR 순서

J → K → L → M. J·K는 의존 X, 병렬 가능하지만 순차 커밋. L은 J/K가 사용. M은 독립.
