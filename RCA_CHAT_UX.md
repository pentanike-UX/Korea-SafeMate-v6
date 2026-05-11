# Phase 1 — RCA (Chat UX 5 defects)

## 1. 인과 그래프

```
[ Root A: 단일 출처 식별자가 메시지에 부재 ]
  → optimistic.id ≠ real.id → Realtime dup-guard 우회 → 칩 중복 (결함 ①)

[ Root B: 인박스/배지 인프라 부재 ]
  → 메시지 도착 → 아무 신호 없음 → 하루이 인지 0 (결함 ②)
  → LNB·헤더에 진입점 0 → 인박스 페이지 도달 불가 (결함 ③)
  → 인박스 도달해도 행 enrichment 0 → 여행자 구분 불가 (결함 ④)

[ Root C: 스레드에 컨텍스트(post) 미보존 ]
  → 시작 포스트 정보 0 → 하루이 의도 추론 불가 (결함 ⑤)
```

세 뿌리가 별개이지만 인박스/배지 인프라(B)·컨텍스트(C)는 같은 DDL 작업으로 함께 처리 가능 → PR 묶음 최적화.

## 2. 결함별 정밀 RCA

### ① 메시지 중복 (칩 클릭 시 두 번 입력)
- 위치: [inquiry-sheet:181–223](src/components/guardians/guardian-inquiry-sheet.tsx:181) + [use-thread-realtime:34](src/hooks/use-thread-realtime.ts:34).
- 시퀀스:
  1. `setMessages([...prev, {id: "opt-X", content: "이 루트 동행…"}])`.
  2. `POST /api/threads/{id}/messages` 요청 in-flight.
  3. Realtime 채널이 INSERT 이벤트 수신 → callback이 `setMessages` 호출, `prev.some(m => m.id === real.id)`는 false → `[opt-X, real]` 상태.
  4. POST 응답 도착 → `.map((m) => m.id === "opt-X" ? real : m)` → `[real, real]`.
- 우선순위: 최우선(가장 잘 보이는 결함).

### ② 알림 부재
- 위치: 전역. 메시지가 들어와도 unread 카운트를 노출하는 컴포넌트가 없음. LNB/헤더 모두 0.
- 메시지 테이블에 `is_read`는 있으나 집계/노출 0.

### ③ 인박스 진입점 부재
- 위치: [mypage-hub-nav-items.ts](src/components/mypage/mypage-hub-nav-items.ts) `TRAVELER_HUB_NAV`/`GUARDIAN_WORKSPACE_NAV` 둘 다 `messages` 항목 없음. 페이지는 존재.
- 우선순위: ②·③·④는 같은 PR로 묶임.

### ④ 여행자 기준 채팅 목록 부재
- 위치: [thread-list-client.tsx:36–46](src/components/chat/thread-list-client.tsx:36). 서버 API([api/threads/route.ts:57–72](src/app/api/threads/route.ts:57))가 raw row만 반환 → 클라이언트가 "하루이"/"여행자"로 고정 표기.
- 해결: API에 join + last_message preview 포함 → 클라이언트는 그대로 렌더.

### ⑤ 포스트 출처 부재
- 위치: 스키마([20260401000013](supabase/migrations/20260401000013_create_message_threads_messages.sql)) `message_threads`에 `source_post_id` 없음. publisher([guardian-request-defaults-publisher.tsx](src/components/guardians/guardian-request-defaults-publisher.tsx))가 post 정보 미전달.
- 해결: 컬럼 추가 + publisher 확장 + sheet 헤더에 출처 라벨.

## 3. 왜 표면 패치가 아닌 client_msg_id?

- 콘텐츠 + 타임스탬프 dedup은 인접 시간에 같은 내용을 두 번 보내는 정상 시나리오를 잡지 못함. 사용자가 "안녕"을 2초 안에 두 번 보내면 한 건이 사라짐.
- `client_msg_id` 컬럼 + unique partial idx로 **확정적**으로 dedup. Realtime dup-guard는 server-issued id 또는 client_msg_id 둘 중 하나로 매칭.
- Messenger / WhatsApp 모두 동일 패턴.

## 4. 영향 범위

| 변경 | 표면 | 위험 |
|---|---|---|
| `messages.client_msg_id` 컬럼 | 메시지 INSERT 경로 | 낮음 — nullable, 신규 메시지만 적용 |
| `message_threads.source_post_id` | 시트·인박스 enrichment | 낮음 — nullable |
| `/api/threads` join | 인박스 렌더 | 낮음 — 응답 키 추가 |
| Realtime dup-guard 변경 | 시트·chat-view | 낮음 — guard만 확장 |
| LNB nav 항목 추가 + unread API | 모든 mypage 페이지 | 낮음 — 추가만 |

다음: DESIGN.md.
