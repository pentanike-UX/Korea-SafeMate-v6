# QA_CHECKLIST — Chat UX overhaul (Messenger-style)

브랜치: `claude/cool-davinci-38d3a9` (PR-F + PR-G + PR-H + PR-I).

## 1. 칩 중복(결함 ①)

`/ko/posts/seed-mg14-ap-04` → 로그인 → "지금 문의하기":
- [ ] 칩 "이 루트 동행 가능한가요?" 1회 클릭 → 메시지가 **1건**만 표시.
- [ ] 동일 칩 다시 클릭 → 메시지 1건 추가, 중복 없음.
- [ ] textarea로 같은 텍스트 2회 빠르게 전송 → 각각 별도 메시지로 노출 (정상). 단 같은 client_msg_id 가 재전송되는 시나리오는 dedup.

서버 검증:
```sql
-- 동일 (thread_id, client_msg_id) 행이 2개 이상이면 dedup 깨진 것
select thread_id, client_msg_id, count(*) c
  from public.messages
  where client_msg_id is not null
  group by 1,2
  having count(*) > 1;
-- 0건이어야 함
```

## 2. 알림(결함 ②)

여행자 계정으로 하루이에게 메시지 전송 → 하루이 계정 로그인:
- [ ] 헤더 우측 메신저 아이콘 옆에 **빨간 숫자 배지** 노출.
- [ ] LNB "메시지함" 옆 배지(있는 경우) 노출.
- [ ] 메시지함 진입 후 해당 행 읽음 처리 → 다음 폴링(<=60s) 후 헤더 배지 감소.

서버 검증:
```sql
select count(*)
  from public.messages
  where is_read = false and sender_user_id != '<guardian-uuid>';
-- API 반환값과 일치해야 함
```

## 3. 인박스 경로(결함 ③)

- [ ] 로그인 후 헤더에 메신저 아이콘 항상 노출(비로그인 시 미노출).
- [ ] 아이콘 클릭 → 여행자: `/ko/mypage/messages`, 하루이: `/ko/mypage/guardian/messages`.
- [ ] LNB → "메시지함" 항목 노출(여행자/하루이 모드 각각).
- [ ] 헤더 드롭다운(추후) — 본 PR에는 미포함.

## 4. 여행자 기준 채팅 목록(결함 ④)

하루이 입장 `/ko/mypage/guardian/messages`:
- [ ] 각 행에 **여행자 표시명**(이메일 로컬파트 또는 실명) 노출.
- [ ] 아바타 노출 (없으면 fallback).
- [ ] 출처 포스트 라벨 "📍 {제목}" 노출 (있을 때만).
- [ ] 마지막 메시지 preview 1줄 + 상대 시간(`방금 전`, `12분 전`, `3시간 전`, `5.12`).
- [ ] unread > 0 행 우측에 빨간 카운트 배지.
- [ ] 정렬: 가장 최근 메시지가 위.

## 5. 출처 포스트(결함 ⑤)

`/ko/posts/seed-mg14-ap-04` → "지금 문의하기" → 시트:
- [ ] 시트 헤더에 "📍 {포스트 제목}" 칩, 클릭 시 해당 포스트 페이지로 이동.
- [ ] 첫 메시지 전송 후 DB `message_threads.source_post_id` 가 채워짐.
- [ ] 하루이 메시지함 → 동일 스레드 행 + 채팅 헤더에 동일 출처 칩.
- [ ] 가디언 프로필(`/ko/guardians/<uuid>`)에서 시작한 문의는 출처 칩 없음(=null).

서버 검증:
```sql
select id, source_post_id
  from public.message_threads
  where traveler_user_id = '<traveler-uuid>'
  order by created_at desc limit 5;
```

## 6. 회귀

- [ ] 이전 스레드(가디언 프로필에서 시작) 정상 노출 — `source_post_id IS NULL`.
- [ ] AI 자동답변(guardian_profiles.ai_auto_reply_enabled = true) 정상 동작.
- [ ] 모바일 ≤ 390px 인박스 행 깨짐 없음.
- [ ] 다크모드 색상 OK.
