# Phase 0 — INVESTIGATION (Chat UX: 5 defects)

대상 5개 결함:
1. 칩 클릭 시 메시지 2번 입력
2. 답변하려면 하루이에게 알림 필요 (현재 0)
3. 알림 인박스 경로 부재
4. 여행자 기준 채팅 목록(=하루이가 보는 채팅 목록을 여행자별로 그룹)
5. 하루이가 어느 루트 포스트에서 문의가 시작됐는지 알아야 함

브랜치: `claude/cool-davinci-38d3a9` (이전 PRs 위에 누적).

## 1. 영향 파일 (1줄 책임)

### API
| 경로 | 책임 |
|---|---|
| [src/app/api/threads/route.ts](src/app/api/threads/route.ts) | POST: 스레드 upsert (정규화 적용 완료). GET: 내 스레드 목록 — **현재 join 없음**(보낼 데이터: id/last_message_at뿐). |
| [src/app/api/threads/[id]/messages/route.ts](src/app/api/threads/%5Bid%5D/messages/route.ts) | GET 메시지 목록 + 읽음 처리. POST 메시지 전송 + AI 자동답변. |

### 컴포넌트
| 경로 | 책임 |
|---|---|
| [src/components/guardians/guardian-inquiry-sheet.tsx](src/components/guardians/guardian-inquiry-sheet.tsx) | 채팅형 문의 시트. **칩 중복 결함의 발생 지점** (낙관 + Realtime 이중 삽입). |
| [src/components/chat/thread-list-client.tsx](src/components/chat/thread-list-client.tsx) | 인박스 목록 + 채팅 분할 뷰. **현재 상대 이름 고정 "하루이"/"여행자"**, avatar/preview 빈 값. |
| [src/components/chat/chat-view.tsx](src/components/chat/chat-view.tsx) | 인박스에서 선택한 스레드의 메시지 뷰 + 전송. |
| [src/hooks/use-thread-realtime.ts](src/hooks/use-thread-realtime.ts) | Realtime 구독. dup-guard는 id 동일성만 검사 → 낙관/실 id 불일치 시 중복 진입 허용. |
| [src/components/guardians/guardian-request-defaults-publisher.tsx](src/components/guardians/guardian-request-defaults-publisher.tsx) | 페이지 진입 가디언 기본값 publish. **post 컨텍스트 없음**(post id/title 미전달). |
| [src/components/mypage/mypage-hub-nav-items.ts](src/components/mypage/mypage-hub-nav-items.ts) | LNB. `GUARDIAN_WORKSPACE_NAV` / `TRAVELER_HUB_NAV` 어느 쪽에도 "메시지함" 항목 없음. |

### 페이지
| 경로 | 책임 |
|---|---|
| [src/app/[locale]/(authed)/mypage/messages/page.tsx](src/app/%5Blocale%5D/%28authed%29/mypage/messages/page.tsx) | 여행자 메시지함 — **이미 존재** 하지만 LNB 미연결. |
| [src/app/[locale]/(authed)/mypage/guardian/messages/page.tsx](src/app/%5Blocale%5D/%28authed%29/mypage/guardian/messages/page.tsx) | 하루이 메시지함 — **이미 존재** 하지만 LNB 미연결. |

### 스키마
| 경로 | 책임 |
|---|---|
| [supabase/migrations/20260401000013_create_message_threads_messages.sql](supabase/migrations/20260401000013_create_message_threads_messages.sql) | `message_threads` — booking_id(now nullable), traveler/guardian/inquiry_kind. **`source_post_id` 없음, `unread_*` 카운터 없음.** |
| [supabase/migrations/20260511000001_chat_v2_schema.sql](supabase/migrations/20260511000001_chat_v2_schema.sql) | pre_booking unique, AI flag, RLS. |
| (없음) | 헤더/네비 unread 배지를 위한 통합 카운터 함수도 없음. |

## 2. 정확한 결함 위치

### ① 칩 클릭 시 메시지 2번 입력
- [inquiry-sheet:181–223](src/components/guardians/guardian-inquiry-sheet.tsx:181)에서 `sendMessage`:
  1. `setMessages([...prev, optimistic])` — optimistic.id = `opt-${Date.now()}`
  2. `POST /api/threads/{id}/messages` → 서버가 메시지를 INSERT
  3. **Realtime INSERT 이벤트가 fire** → [use-thread-realtime:34](src/hooks/use-thread-realtime.ts:34) callback이 `setMessages`에 실 메시지 추가. dup-guard `prev.some(m=>m.id===newMsg.id)`는 optimistic.id !== real.id 라 통과 → [opt, real] 상태.
  4. POST 응답 받음 → `setMessages.map((m) => m.id === optimisticId ? message : m)` → [real(replaced from opt), real] = **중복**.
- 입력바로 보내도 같은 dup 잠재. 칩이 더 도드라지는 이유: 칩은 클릭 즉시 한 메시지가 통째로 들어가서 사용자가 명백히 중복을 인식.

### ② 하루이에게 알림 없음
- 메시지가 들어와도 하루이 측에 노출되는 신호는 **0**. 헤더 어디에도 unread 표기 없음. LNB에 메시지함 자체가 없으니 배지 슬롯도 없음.
- 메시지 테이블에 `is_read: boolean`은 있지만 **집계 API/표시 없음**.

### ③ 인박스 경로 부재
- 페이지는 둘 다 존재(여행자 `/mypage/messages`, 하루이 `/mypage/guardian/messages`), 그러나:
  - [mypage-hub-nav-items.ts:65–71](src/components/mypage/mypage-hub-nav-items.ts:65) `TRAVELER_HUB_NAV`에 항목 없음.
  - [mypage-hub-nav-items.ts:101–119](src/components/mypage/mypage-hub-nav-items.ts:101) `GUARDIAN_WORKSPACE_NAV`에 항목 없음.
  - 헤더 드롭다운 메뉴([header-account-menu.tsx](src/components/auth/header-account-menu.tsx))에도 없음.

### ④ 여행자 기준 채팅 목록 부재
- [thread-list-client.tsx:38–46](src/components/chat/thread-list-client.tsx:38): "TODO(prod): 서버에서 join으로 display_name, avatar, preview를 내려주도록 개선" 주석만. 실제로는 상대 이름 = "하루이" or "여행자" 하드코딩, 아바타 null, preview는 날짜만.
- 즉 하루이가 메시지함을 열어도 "여행자" "여행자" "여행자" 같은 알 수 없는 행만 보임 → 여행자별 구분 불가.

### ⑤ 어느 포스트에서 시작됐는지 모름
- `message_threads`에 `source_post_id`(또는 동등 컬럼) 없음.
- `GuardianRequestDefaultsPublisher`도 post 정보 미포함.
- 결과: 하루이가 스레드 헤더에서 "어느 포스트 보고 왔는지" 추론 불가.

## 3. 데이터 흐름 한 그림

```
[여행자: 포스트 상세] /posts/seed-mg14-ap-04
        │ GuardianRequestDefaultsPublisher(guardianUserId, displayName, avatarUrl)
        │   ↳ post 정보 미포함 ❌
        ▼
[Inquiry sheet 오픈]
        │ POST /api/threads { guardian_user_id }   (정규화 완료)
        │   ↳ source_post_id 미전달 ❌
        ▼
[message_threads INSERT]   (post 컨텍스트 없음)
        │
        ▼
[여행자 메시지 송신]
        │ POST /api/threads/{id}/messages → real INSERT
        │   ↳ Realtime INSERT fires
        │   ↳ optimistic + realtime 이중 삽입 ❌ (결함 ①)
        ▼
[하루이 측]
        │ ❌ unread 알림 신호 없음 (결함 ②)
        │ ❌ LNB 인박스 진입점 없음 (결함 ③)
        │ (인박스 페이지 자체는 있음 — /mypage/guardian/messages)
        ▼
[하루이가 우연히 인박스에 들어옴]
        │ ❌ 행마다 "여행자" 표기, 아바타·preview 빈값 (결함 ④)
        │ ❌ 출처 포스트 미표기 (결함 ⑤)
```

## 4. Phase 1로 가져갈 결정 사항

- Realtime dedup 전략: **client_msg_id**(클라이언트 uuid) 도입 vs 단순 후처리 dedup (content+role+timestamp grace window). 권장: client_msg_id (확정적).
- 알림 채널: 별도 `notifications` 테이블 vs 기존 `messages.is_read` 기반 집계. 권장: 후자(단순 + 충분).
- 인박스 진입점: LNB + 헤더 드롭다운 + (모바일) 헤더 아이콘. **헤더 아이콘**이 Messenger-스러움.
- 여행자 행 enrichment: 서버 join (`/api/threads`)에서 `user_profiles.display_name` + `avatar_image_url` + `messages.content` LIMIT 1 LATERAL.
- 포스트 출처: `message_threads.source_post_id uuid null references content_posts(id)` + 클라이언트 전달 경로 정비.
- 칩 UX: Messenger처럼 한 번만 입력하고, 보낸 후 더 이상 보이지 않게.

## 5. QUESTIONS (기본값으로 진행 가능; 다르면 알려 주세요)

1. 알림 모델: **messages.is_read 기반 집계** (별도 테이블 X) — OK?
2. dedup 전략: **client_msg_id 컬럼 추가 후 unique partial idx** — OK?
3. 인박스 진입점: **LNB + 헤더 메신저 아이콘**(unread 배지 포함) 둘 다 — OK?
4. 포스트 출처: `source_post_id` 컬럼 + 인박스/시트 헤더에 "포스트 제목 → 클릭 시 포스트로 이동" — OK?
5. 본 브랜치 위에 PR-F → PR-G → PR-H 누적, 별도 PR 분리 — OK?

답 없으면 위 기본값으로 RCA → DESIGN → PRs 진행합니다.
