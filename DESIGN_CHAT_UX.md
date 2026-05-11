# Phase 2 — DESIGN (Messenger-like Chat UX)

## 0. Q&A 기본값 (사용자 무응답 시)

| Q | 기본값 |
|---|---|
| 알림 모델 | `messages.is_read` 기반 집계 (별도 테이블 X) |
| dedup 전략 | `messages.client_msg_id text` + unique partial idx |
| 인박스 진입점 | LNB 항목 추가 + 헤더 메신저 아이콘(unread 배지) |
| 포스트 출처 | `message_threads.source_post_id` 컬럼 + sheet/inbox 헤더에 포스트 라벨 |
| 베이스 | 현 브랜치 위에 PR-F → PR-G → PR-H → PR-I 누적 |

## 1. 스키마

```sql
-- F1: 메시지 dedup
alter table public.messages
  add column if not exists client_msg_id text;
create unique index if not exists messages_client_msg_id_uidx
  on public.messages (thread_id, client_msg_id)
  where client_msg_id is not null;

-- F2: 스레드 출처 포스트
alter table public.message_threads
  add column if not exists source_post_id uuid references public.content_posts(id);
create index if not exists message_threads_source_post_idx
  on public.message_threads (source_post_id);

-- Rollback (수동):
-- drop index if exists public.messages_client_msg_id_uidx;
-- alter table public.messages drop column if exists client_msg_id;
-- drop index if exists public.message_threads_source_post_idx;
-- alter table public.message_threads drop column if exists source_post_id;
```

RLS 영향 없음 (기존 정책이 traveler/guardian/admin 기준이라 새 컬럼은 자동 보호).

## 2. API 계약

### 2.1 `POST /api/threads`
요청(둘 다 허용):
```jsonc
{
  "guardian_user_id": "<uuid|slug>",
  "source_post_id": "<uuid>"              // 신규, 선택 — 처음 생성 시에만 저장
}
```
응답: 기존과 동일 + `thread.source_post_id`.

### 2.2 `GET /api/threads` (enriched)
응답:
```jsonc
{
  "threads": [
    {
      "id": "uuid",
      "traveler_user_id": "uuid",
      "guardian_user_id": "uuid",
      "inquiry_kind": "pre_booking",
      "last_message_at": "ISO",
      "unread_count": 3,                   // 내가 읽지 않은 상대 메시지 수
      "source_post": null | { "id":"uuid","title":"...","cover_image_url":"...|null" },
      "other": {
        "user_id": "uuid",
        "display_name": "...",
        "avatar_url": "...|null",
        "role": "traveler" | "guardian"
      },
      "last_message_preview": "최대 80자",
      "last_message_role": "traveler" | "guardian" | null,
      "last_message_is_ai": false
    }
  ]
}
```

### 2.3 `POST /api/threads/[id]/messages`
요청 추가:
```jsonc
{ "content": "...", "client_msg_id": "uuid-v4" }
```
서버: `client_msg_id`가 있으면 그대로 저장. unique 위반 시 기존 메시지 반환 (idempotent).

### 2.4 (신규) `GET /api/notifications/unread`
```jsonc
{ "messages_unread_total": 5 }
```
- 사용자 입장에서 자신이 참여한 모든 스레드에 대해 `messages where is_read=false and sender_user_id != me` 카운트.
- 헤더 아이콘 배지 + LNB 메시지 항목 배지.
- 클라이언트 캐시 60초.

## 3. UX (Messenger 스타일)

### 3.1 헤더 — 메신저 아이콘
- 데스크톱·모바일 모두 헤더 우측, 사용자 아바타 좌측에 `<MessageCircle />` 아이콘 버튼.
- unread > 0 시 우상단 빨간 점 + 숫자(>9 → "9+").
- 클릭 시 본인 역할에 따라:
  - traveler → `/mypage/messages`
  - guardian (mode 따라) → `/mypage/guardian/messages` or `/mypage/messages`
- 비로그인 시 숨김.

### 3.2 LNB — 메시지 항목
- `TRAVELER_HUB_NAV`에 `{ href: "/mypage/messages", labelKey: "navMessages", Icon: MessageCircle }` 추가.
- `GUARDIAN_WORKSPACE_NAV`에 `{ href: "/mypage/guardian/messages", labelKey: "guardianNavMessages", Icon: MessageCircle }` 추가.
- unread 배지는 기존 attention badge 메커니즘에 새 키 `navMessages` / `guardianNavMessages` 추가.

### 3.3 인박스 화면 — 여행자 기준 채팅 목록
- 행 = 1 thread. 표시:
  - 아바타(상대) + 온라인 점(가디언 마지막 5분).
  - **상대 이름**(여행자: 표시명 또는 이메일 로컬파트).
  - **출처 포스트 미니 라벨** "📍 한강 야경 루트" (있으면).
  - 마지막 메시지 preview 1줄 + 상대 시간(예: "방금 전").
  - 우측: unread 카운트 배지.
- 행 클릭 → 우측 채팅 뷰 활성(데스크톱) 또는 풀스크린(모바일).
- 정렬: `last_message_at desc nulls last`.

### 3.4 채팅 뷰 헤더
- 상대 아바타·이름·온라인 표시 + **출처 포스트 칩** (있으면 → 클릭 시 포스트 새 탭).

### 3.5 칩 (quick replies)
- 보낸 후 즉시 칩 숨김(이미 `showQuickReplies` 로직 있음).
- 송신은 단일 message INSERT만 — Realtime + client_msg_id dedup으로 중복 차단.

## 4. dedup 알고리즘

### Client
```ts
const clientMsgId = crypto.randomUUID();
const optimistic = { id: `opt-${clientMsgId}`, client_msg_id: clientMsgId, content, ... };
setMessages([...prev, optimistic]);
POST /api/threads/{id}/messages { content, client_msg_id };
```

### Realtime callback
```ts
setMessages((prev) => {
  if (prev.some((m) => m.id === newMsg.id)) return prev;                 // 동일 server id
  const optimisticIdx = prev.findIndex((m) => m.client_msg_id === newMsg.client_msg_id);
  if (optimisticIdx >= 0) {
    const copy = [...prev];
    copy[optimisticIdx] = newMsg;                                        // optimistic → real 교체
    return copy;
  }
  return [...prev, newMsg];                                              // 정말 새 메시지
});
```

### Server
```ts
// upsert by (thread_id, client_msg_id) → 멱등
insert ... returning *
// unique violation 23505 → select existing row 반환 (idempotent)
```

## 5. PR 분리

### PR-F — Schema (DDL)
- `messages.client_msg_id`, `message_threads.source_post_id` 컬럼 + idx.
- 마이그레이션 파일 + MCP 적용.
- 타입(GpRow/MessageThread/ChatMessage) 갱신.

### PR-G — API
- `GET /api/threads` 응답에 join + unread + source_post + other 포함.
- `POST /api/threads/[id]/messages` client_msg_id 허용 + 23505 idempotent.
- `POST /api/threads` source_post_id 허용 + 정규화.
- `GET /api/notifications/unread`.

### PR-H — UI (인박스 + nav + 헤더 아이콘)
- LNB 항목 + i18n 키 추가.
- `<HeaderInboxButton />` (헤더 메신저 아이콘 + unread 폴링 60s).
- `ThreadListClient` 갱신 — 새 응답 스키마 사용, 여행자별 행 enrichment.
- 채팅 뷰 헤더에 source_post 칩.

### PR-I — Inquiry sheet (dedup + post 전달)
- Publisher에 `sourcePostId` prop 추가, 포스트 상세 페이지에서 전달.
- Sheet에서 `POST /api/threads` 호출 시 `source_post_id` 전달.
- `sendMessage`에 `client_msg_id` 생성·전달.
- Realtime dedup 로직 확장.
- 시트 헤더에 출처 포스트 라벨.

## 6. 검증

### 단위
- `useThreadRealtime` dedup: optimistic.client_msg_id == newMsg.client_msg_id 일 때 단일 메시지로 유지.
- `POST /api/threads/[id]/messages` 멱등성: 같은 client_msg_id 두 번 전송 시 같은 메시지 반환.

### API smoke (curl)
- 메시지 두 번 전송 → 한 행만 INSERT, 두 번째는 기존 행 반환.
- `/api/threads` 응답에 `other`/`unread_count`/`source_post` 키 존재.
- `/api/notifications/unread` 합계 정확.

### E2E
1. `/ko/posts/seed-mg14-ap-04` → 시트 → 칩 클릭 1회 → 메시지 **1건만** 노출.
2. 같은 칩 다시 클릭 (네트워크 지연 시뮬레이션) → 1건만 추가, 2건 미만.
3. 하루이로 로그인 → 헤더 메신저 아이콘에 unread 숫자 → 클릭 → 인박스 도달.
4. 인박스 행에 **여행자 표시명** + 출처 포스트 라벨 + last preview.
5. 채팅 뷰 헤더에 "📍 …" 클릭 → 해당 포스트로 이동.
6. 메시지 읽음 처리 후 헤더 배지 0으로 감소.

### 수동 (QA_CHECKLIST_CHAT_UX.md, Phase 4)
- 헤더 아이콘 위치(모바일/데스크톱), 다크모드, ko/en.
- 채팅 30초 안에 동일 칩 두 번 — 한 건만 노출.
- 모바일 ≤390px 인박스 행 깨짐 없음.

## 7. Acceptance

| Acceptance | PR | Test |
|---|---|---|
| 칩 클릭 시 메시지 1건만 노출 | I | E2E #1·2 |
| 하루이에게 unread 신호(헤더 + LNB) | G+H | E2E #3 |
| 인박스 진입 경로 존재 | H | E2E #3 |
| 여행자별 행 식별 가능 | G+H | E2E #4 |
| 출처 포스트가 인박스·시트 헤더에 노출 | F+G+H+I | E2E #4·5 |

---

**확인 요청**: 위 설계로 PR-F → G → H → I 진행해도 될까요? 다른 결정이 필요하면 알려 주세요.
