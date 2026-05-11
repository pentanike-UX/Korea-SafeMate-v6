# QA_CHECKLIST — guardian inquiry & 하루웨이 fix

브랜치: `claude/cool-davinci-38d3a9` (PR-A, PR-B, PR-C, PR-C fix)
Staging URL: 배포 후 확인.

## 1. /api/threads 정규화 (PR-B)

로그인 후 브라우저 콘솔 또는 curl로:

```sh
# (1) 슬러그 입력 — 정규화되어 201 또는 200(기존)
curl -X POST $BASE/api/threads -H "Content-Type: application/json" \
  --cookie "$(cat cookies.txt)" \
  -d '{"guardian_user_id":"mg13"}' -i

# (2) UUID 입력 — 동일 동작
curl -X POST $BASE/api/threads -H "Content-Type: application/json" \
  --cookie "$(cat cookies.txt)" \
  -d '{"guardian_user_id":"e1c15fda-0462-5000-a5df-961ca128dc7d"}' -i

# (3) not_found
curl -X POST $BASE/api/threads -H "Content-Type: application/json" \
  --cookie "$(cat cookies.txt)" \
  -d '{"guardian_user_id":"nope"}' -i
# expect: 404 { "error": "guardian_not_found" }

# (4) body 누락
curl -X POST $BASE/api/threads -H "Content-Type: application/json" \
  --cookie "$(cat cookies.txt)" \
  -d '{}' -i
# expect: 400 { "error": "guardian_user_id required" }
```

- [ ] (1)/(2) 동일한 `thread.id` 반환 (unique idx로 중복 생성 방지)
- [ ] (3) 404 + `guardian_not_found`
- [ ] (4) 400 + `guardian_user_id required`
- [ ] 서버 로그에 `[POST /api/threads] normalize fail` (3번 케이스만)

## 2. 포스트 상세 — "지금 문의하기" 채팅 (결함 ①)

`/ko/posts/seed-mg14-ap-04` (mock-only 포스트, 슬러그 author):

- [ ] "지금 문의하기" 버튼 → 시트 오픈, 로딩 점 3개 → 사라짐.
- [ ] textarea **활성화**, placeholder "메시지 입력…" 보임.
- [ ] 칩 "이 루트 동행 가능한가요?" 클릭 → 오른쪽 말풍선 즉시 표시 → 서버 응답 후 ID 교체.
- [ ] Enter 전송 / Shift+Enter 줄바꿈 / 500자 제한.
- [ ] 시트 닫고 재오픈 → 동일 thread, 메시지 누락 없음.
- [ ] 동일 가디언의 프로필(`/ko/guardians/<uuid>`)에서 다시 열어도 같은 `thread.id`.

## 3. 가디언 프로필 "이 하루이의 하루웨이" (결함 ②)

`/ko/guardians/e1c15fda-0462-5000-a5df-961ca128dc7d` (mg13):

- [ ] "이 하루이의 하루웨이" 섹션에 카드 ≥ 1.
- [ ] `t("noPosts")` 안내 문구는 노출되지 않음.
- [ ] 카드 클릭 → 포스트 시트 정상 동작.

(생산 시드에서 mg13 DB 포스트는 0건 → mock 포스트(`seed-mg13-*`)가 fill됨. 추후 DB에 mg13 포스트가 들어가면 우선 노출.)

## 4. 프로필 온라인 인디케이터 + 문의 진입점 (결함 ③)

`/ko/guardians/<uuid>`:

- [ ] hero에 "지금 온라인" 또는 "오프라인" 배지 노출.
- [ ] mock 가디언(`last_seen_at = "mock:online"`)은 항상 온라인.
- [ ] DB 가디언은 `last_seen_at` 5분 임계값으로 판정 (아직 heartbeat 미구현 — 오프라인 정상).
- [ ] aside 카드: "지금 문의하기" + "요청하기" 둘 다 보임 (flag 기본 ON).
- [ ] 모바일 sticky CTA: "지금 문의하기" / "요청하기" 2-그리드.
- [ ] `NEXT_PUBLIC_INQUIRE_NOW_ON_PROFILE=0` 설정 후 재배포 → aside의 "지금 문의하기"만 숨김, "요청하기"는 유지.

## 5. 에러 UX (PR-C inquiry-sheet)

서버를 강제로 500 만든 후 (또는 `guardian_user_id`를 알 수 없는 슬러그로 publish):

- [ ] `404` → "하루이를 찾을 수 없어요" 패널, 다시 시도 버튼 없음, 입력바 숨김.
- [ ] `5xx/네트워크` → "잠시 연결이 어려워요" + "다시 시도" 버튼.
- [ ] "다시 시도" 클릭 → 다시 로딩 → 정상 시 입력바 노출.

## 6. i18n / 다크모드 / 모바일

- [ ] ko/en 라벨: "지금 온라인" / Online now ("ko" 기준 문구가 영어 빌드에서도 깨지지 않음 — 본 PR는 ko 하드코딩이라 후속 i18n 필요. 영어 페이지에서도 한국어로 표시되는 한정 수용).
- [ ] 다크모드: aside emerald 버튼 콘트라스트 OK.
- [ ] 모바일 ≤390px: hero 배지·sticky CTA 줄바꿈 없음.

## 7. 회귀 (다른 진입점)

- [ ] 가디언 목록(`/ko/guardians`): 카드에 "지금 문의하기" + 온라인 배지 정상.
- [ ] 저장한 하루이(`/ko/mypage/saved-guardians`): 동일.
- [ ] 가디언 목록에서 카드 클릭 → 프로필 → 동일 결과.
