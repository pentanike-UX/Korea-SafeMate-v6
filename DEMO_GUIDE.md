<!-- markdownlint-disable-file MD013 MD025 MD034 -->

# Korea SafeMate — Demo Guide (MVP)

> 이 문서는 **MVP 데모 시연용 가이드**입니다. 대표 / 내부 개발팀 / 외부 투자자가 URL을 받아 직접 클릭하며 제품을 이해할 수 있도록 설계된 시연 시나리오와 환경 설정을 정리합니다.
>
> 실제 서비스 오픈은 인수 후 내부 개발팀에서 별도로 재개발합니다. **이 데모의 목적은 "오 이정도면 만들어도 되겠다" 반응을 끌어내는 것**입니다.

---

## 1. 빠른 시작 (시연자용)

### 1-1. URL 진입
- **외국인 시점 (영어)**: `https://<deploy-url>/` ← 기본 진입
- **한국 시점**: `https://<deploy-url>/ko`
- 데모는 영어 시점에서 가장 임팩트가 큽니다.

### 1-2. 환경변수 (`.env.local`)
실 시연 환경 (로컬/Vercel)에서 다음이 설정되어야 합니다:

```bash
# Supabase (필수 - DB/Auth)
NEXT_PUBLIC_SUPABASE_URL=https://twxlokedllghbpztoiej.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI 자동답변 (선택, 내부 LLM 사용 시)
LOCAL_AI_BASE_URL=http://10.0.220.1/v1          # 내부 LLM 서버
LOCAL_AI_MODEL=Qwen/Qwen2.5-Coder-14B-Instruct-AWQ

# 또는 Vercel AI Gateway / Anthropic API
AI_GATEWAY_API_KEY=...
# ANTHROPIC_API_KEY=...

# Google OAuth + Places (가디언 상세 페이지 사진)
GOOGLE_PLACES_API_KEY=...
```

> **AI 키가 없어도 데모는 동작**합니다. 키워드 매칭 폴백 답변이 자동으로 노출되며, 시연 흐름에 큰 차이는 없습니다. (Qwen LLM이 연결되면 답변 품질이 자연스러워집니다.)

### 1-3. 시드 데이터 적용 (최초 1회)
```bash
pnpm seed:users -- --apply     # 15개 mock 하루이 계정 생성
pnpm seed:sample -- --apply    # 시드 가디언 프로필 + 65개 포스트
```
이미 적용된 상태라면 스킵.

---

## 2. 권장 시연 시나리오 (3분 영어 흐름)

### 시작 컨셉
> *"내가 외국인 여행자라고 가정하고, 처음 한국에 와서 서울 하루를 어떻게 보낼지 찾는 시점."*

### Step 1 — 홈 (영어 hero)
**URL**: `/`
- `Your day in Seoul, your kind of route.` 헤로
- 백팩 든 외국인 여행자 이미지 (전체 페이지 배경)
- "Browse routes" / "How it works" CTA

**Pause point**: "지금부터 그 외국인 여행자가 되어 봅니다."

### Step 2 — 가디언 디스커버
**URL**: `/guardians`
- `THOSE WHO OPEN YOUR DAY` 부제 + `haruee` 타이틀
- 카드 리스트 — `Verified haruee` / `Active haruee` 배지
- 박도윤 카드: **"Dohyun Park" + 영어 헤드라인 + 4.6★**

**Pause point**: "카드마다 언어/지역/스타일이 보이고, 외국인 여행자가 1분 안에 자기에게 맞는 사람을 고를 수 있습니다."

### Step 3 — 박도윤 상세
**URL**: `/guardians/mg10` 또는 `/guardians/325e8a02-9683-5a53-8e26-42aca7a8f431`
- **Dohyun Park** 헤더 + 헤드라인 + 4.6★
- "Introducing this guardian" 3 문단 영어 long_bio (자연스러운 톤)
- "Dohyun's style: short check-ins..." 시그니처 인용
- "On-the-ground feel" 사진 갤러리
- "Chat now" / "Request" 큰 CTA (하단 고정)

**Pause point**: "한 명의 가디언을 깊이 이해할 수 있는 정보가 다 영어로 보여집니다 — 외국인 친화."

### Step 4 — 지금 문의하기 (Chat now)
- "Chat now" 클릭 → 인콰이어리 시트 슬라이드 인
- 비로그인 시: "Sign in to chat" 안내
- 로그인 시: 채팅 시작 + 자동 AI 답변 (Qwen2.5-Coder가 한국어 가이드 페르소나로 답변)

**Pause point**: "한국어 가이드의 톤을 학습한 AI가 1차 답변. 가디언이 직접 답할 때까지 대화가 끊기지 않습니다."

### Step 5 — 라우트 포스트 + 결제 흐름 ⭐ (클라이맥스)
**URL**: `/posts/<route-post-id>` 예) `/posts/8dfe38bf-3dd1-551a-93d4-50ba468c9f77`
- 무료 영역: hero + 요약 + 스팟 4곳 (잠긴 상태, "Expand for real venue name...")
- 스팟 카드 클릭 → **잠금 시트** 열림 ("Stop-by-stop guide", 5개 혜택, `Pay · ₩29,000`)
- "Pay" → **결제 수단 선택** (Toss Pay 파란색 / Kakao Pay 노란색, **DEMO** 배지)
- Toss 선택 → **풀스크린 결제 진행 화면** (2.5초, 로딩 스피너 + "Processing payment...")
- 자동 전환 → **결제 완료** (2초, 체크 아이콘 + "Payment complete")
- 시트 자동 닫힘 → **모든 스팟 펼침 가능** (실제 매장명/주소/사진 갤러리 노출)

**Pause point**: "**비즈니스 모델의 핵심**: 무료로 살펴보고, 진짜 가치를 얻을 때만 결제. 토스/카카오페이로 한국 시장에 맞춰 설계."

### Step 6 — 매칭 성공 ("...그리고 매칭!")
- 가디언 상세 또는 라우트 페이지에서 "Request" 클릭 → 요청 폼 작성 → 제출
- 자동 이동: `/book/success` (영어)
- **MATCHED 배지 + "Matched with Dohyun Park!"** 대형 헤딩
- ✨ **AI 자동답변 미리보기** ("Hi! Checking my schedule — I'll send a precise reply within 1–2 hours ☺️")
- **"Open chat with Dohyun Park"** 큰 CTA → 클릭 시 인콰이어리 시트 자동 열림
- **WHAT'S NEXT** 3단계 타임라인 (Now → Within today → After confirm)

**Pause point (마무리)**: "여행자는 매칭 즉시 'Dohyun이 답했어요' 알림을 받고, 같은 화면에서 채팅을 이어갈 수 있습니다. 끊김 없는 종착."

---

## 3. 데모 시 강조 포인트 (이해관계자 설득)

### 차별점 1 — 매칭의 자연스러움
- 가디언 카드의 신뢰 배지 (Verified / Language checked / Reviewed by travelers)
- 박도윤 영어 long_bio의 톤 — 과장 없는 현장형 ("After ~7 years in Seoul, I read the same blocks differently by daypart")
- "Chat now" → 즉시 채팅 + AI 1차 답변

### 차별점 2 — 콘텐츠 풍부함
- 시드 65개 포스트 모두 `route_journey` 보유 (스팟 4곳 + 가이드 + 사진)
- 스팟 카드의 디테일: "13:00 / 1번 강남구... / Suggested stay 20 min / 도보 약 6분 450m"
- Field memo 섹션: "If you're new, anchor here first / Sort this first / Vibe note"

### 차별점 3 — Freemium 비즈니스 모델
- **무료**: 발견 + 요약 + 사진 1개
- **₩29,000**: 한 루트 풀가이드 (Toss/Kakao 결제)
- **Quote**: 가디언 1:1 맞춤 요청
- DEMO 배지로 가짜 결제임을 명시 (투자자 혼동 방지)

### 차별점 4 — 한국 현지 정보
- 가디언 상세에 Google Places 사진 자동 로딩
- Naver 로컬 검색 + 이미지 검색 (관리자 검수)
- 스팟별 한국 지역 디테일 (광화문·종로·강남·홍대 등)

---

## 4. 시연자가 알아야 할 백엔드 컨텍스트

### 4-1. Mock 가디언 로그인 (시연 편의)
- `/login` 페이지 하단에 **mg01~mg15 mock 로그인 버튼** 노출
- 클릭 시 즉시 해당 가디언으로 로그인 (Supabase OAuth 불필요)
- **15명 모두 동일하게 동작** (이전 QA 검증: 37/38 PASS)
- 박도윤(mg10)이 시연 종착 가디언이므로 가장 풍부함

### 4-2. AI 자동답변
- LOCAL_AI 우선 (Qwen2.5-Coder, 내부 LLM 서버)
- 실패 시 Anthropic/AI Gateway 자동 폴백
- 양쪽 다 실패 시 키워드 매칭 폴백 (4가지: 일정·가격·동행·언어)
- 답변에 `[자동 초답]` 접두사 자동 부여
- 가디언이 `ai_auto_reply_enabled=true`인 경우만 활성 (현재 mg10/mg13/mg14/mg15)

### 4-3. 시드 데이터
- 15명 가디언 (mg10~mg15가 approved, 공개 노출)
- 65개 시드 포스트 (모두 `route_journey` 보유, 평균 4개 스팟)
- 박도윤 5건 영어 가짜 리뷰 (`Yuki·Tokyo`, `Marc·Montréal`, `Hannah·UK`, `Sora·Osaka`, `Leo·Berlin`)

### 4-4. i18n
- 기본 locale: `en` (외국인 진입 시 자동), prefix 없음 (`/`)
- 한국어: `/ko/...`
- 영어 시점에서 `하루이→haruee`, `하루웨이→haruway`, `하루→haru` 음역 일관
- 박도윤 한정 영어 큐레이션 (`guardian-demo-curation.ts`)

---

## 5. 인수 시 개발팀 참고사항

### 5-1. 데모 한정 코드 (실서비스 전환 시 제거 대상)
| 위치 | 내용 |
|---|---|
| `src/lib/dev/mock-guardian-auth.ts` | mg01~mg15 mock 로그인 — 프로덕션에선 가드 또는 제거 |
| `src/components/auth/mock-guardian-quick-login.tsx` | 로그인 페이지 mock 버튼 노출 — `NODE_ENV !== 'production'` 게이팅 권장 |
| `src/components/route-posts/playbook-unlock-sheet.tsx` | 가짜 결제 4단계 시뮬레이션 — 실 PG (Toss SDK, Kakao SDK) 교체 |
| `src/lib/guardian-demo-curation.ts` | 박도윤 영어 큐레이션 헬퍼 — DB에 `display_name_en` 등 컬럼 추가 후 제거 |
| `src/components/booking/matched-guardian-hero-card.tsx` | 가짜 AI 답변 미리보기 (`autoReplyExample`) — 실제 매칭 후 첫 메시지로 교체 |

### 5-2. TODO(prod) 마커
코드 전반에 `TODO(prod):` 주석으로 실서비스 전환 포인트 표시됨. `git grep "TODO(prod)"` 로 확인 가능.

### 5-3. 핵심 컴포넌트 위치
- 가디언 상세: `src/components/guardians/guardian-detail-view.tsx`
- 인콰이어리 시트: `src/components/guardians/guardian-inquiry-sheet.tsx`
- 가짜 결제: `src/components/route-posts/playbook-unlock-sheet.tsx`
- 매칭 성공: `src/components/booking/matched-guardian-hero-card.tsx`
- AI 자동답변: `src/app/api/threads/[id]/messages/route.ts`

### 5-4. DB 스키마
- `supabase/schema.sql` / `supabase/schema_production.sql`
- 마이그레이션: `supabase/migrations/` (날짜 prefix)
- RLS 정책 적용됨 (message_threads / messages / guardian_profiles 등)

---

## 6. 시연 후 정리 (선택)

테스트 데이터 정리:
```sql
-- 데모 중 생성된 테스트 스레드/메시지 삭제 (mock guardian 간)
delete from messages where thread_id in (
  select id from message_threads where created_at > now() - interval '1 day'
);
delete from message_threads where created_at > now() - interval '1 day';
```

시드 재적용 (포스트 콘텐츠 수정 후):
```bash
pnpm seed:sample -- --apply  # 같은 ID로 upsert
```

---

## 7. 자주 묻는 질문 (시연 중)

**Q. 결제는 실제로 됩니까?**
A. 아니요. DEMO 배지로 표시되어 있고, 결제 진행 화면은 시뮬레이션입니다. 실서비스 전환 시 Toss/Kakao SDK로 교체합니다.

**Q. AI는 어떤 모델인가요?**
A. 현재 데모는 내부 Qwen2.5-Coder-14B (또는 Anthropic Claude Haiku 4.5). Vercel AI Gateway를 통해 다른 모델 교체 용이.

**Q. 가디언은 어떻게 등록하나요?**
A. 시연 단계: mock 시드 15명. 실서비스: `/guardians/apply` 폼 + 운영팀 승인 워크플로.

**Q. 어디까지 만들어진 건가요?**
A. MVP 데모 — 핵심 흐름 (탐색·매칭·결제·채팅·AI 답변)만 동작. 실 결제, 알림 (이메일/SMS), 정산, 운영자 대시보드 등은 인수 후 개발.

---

*문서 버전: v1.0 · MVP 데모용 · 인수 후 실서비스 개발팀이 별도 문서로 대체*
