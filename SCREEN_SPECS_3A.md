<!-- markdownlint-disable-file MD013 MD022 MD028 MD032 MD036 MD031 MD040 MD058 MD024 -->
# Korea Safe Mate — Screen Specs 3A
## Marketing + Auth 화면 · v1.0

> 전제 문서: [Foundation](./FOUNDATION.md) · [IA](./IA_SCREEN_INVENTORY.md) · [4단 Data/API](./DATA_MODEL_API.md) (타입·저장소 구현 시)
> 본 파일은 목업 시안([M]) 우선 구현 대상 7개 화면의 상세 스펙을 정의한다.
> 각 화면은 표준 템플릿을 따른다.
>
> **구현 착수 전:**
> IA 문서 섹션 13의 갭 리포트·계획서 승인이 완료된 상태여야 한다.
> 확인 안 됐으면 중단하고 질문할 것.

> **저장소 메모 (이 워크스페이스):** 공통 UI는 **`src/components/ui/`** 아래를 말한다. Mock 데이터는 현재 **`src/data/mock/`** 등이며, 본문의 `lib/mock/`는 **목표 경로**로 점진 이관한다. 마케팅·인증 URL은 대부분 **`src/app/[locale]/...`** 트리와 매핑해야 하며, §경로의 `/`는 로케일 접두 규칙(next-intl `as-needed`)과 함께 설계한다. **A04** 목업에서 `localStorage`를 쓰는 서술은 Foundation §3.2(스토리지 직접 접근 금지)와 상충할 수 있으므로 **임시 목업 전용**으로 두고, 프로덕션 전 쿠키·서버 프로필 저장으로 교체한다(TODO).

---

## 공통 사전 정의

### 공통 컴포넌트 (이 파일 구현 전 존재해야 함)
아래 원자 컴포넌트가 `src/components/ui/`에 존재하지 않으면, 화면 구현 전 먼저 생성한다.

| 컴포넌트 | 파일명 | 역할 |
|---------|--------|------|
| Button | `button.tsx` | primary / secondary / ghost / destructive variant |
| Input | `input.tsx` | text, email, phone, with error state |
| Badge | `badge.tsx` | default / accent / ok / muted |
| Avatar | `avatar.tsx` | 이미지 + 이니셜 폴백 |
| Skeleton | `skeleton.tsx` | 가변 크기 |
| Toast | `toast.tsx` | success / error / info / warning |
| Logo | `logo.tsx` | SVG, 단독 마크 + 풀 로고타입 variant |
| LanguageSwitcher | `language-switcher.tsx` | ko/en/th/vi 전환 |

### 색상·타이포 — Foundation 4.2 토큰 사용 강제
모든 화면에서 하드코딩된 hex 값 사용 금지. 반드시 CSS 변수 참조.

```tsx
// 금지
className="text-[#1A2540]"
// 허용
className="text-ink"  // tailwind.config에 --ink 연결
```

---

## M01 — Landing (Traveler)

**목적:** 동남아 20대 여성 Mai가 처음 진입했을 때 "서울 트라이브가 짜준 하루"의 가치를 3초 안에 이해하고 탐색을 시작하게 만드는 진입점.
**릴리즈:** [M] [P]
**경로:** `/`

### 인바운드 / 아웃바운드
- **In:** SNS 광고·링크 공유·직접 URL 진입
- **Out:** `/explore` (CTA 버튼), `/how-it-works`, `/guardian`, `/login`

### Layout

```text
<MarketingLayout>   ← 헤더(로고+nav+언어전환+로그인), 푸터
  <HeroSection>
  <TrustSection>
  <HowItWorksTeaser>
  <GuardianShowcase>
  <PricingTeaser>
  <FinalCTA>
</MarketingLayout>
```

Header:
- 로고(좌) + 네비게이션(중앙: How it works · Pricing · For Guardians) + LanguageSwitcher + "Get Started" 버튼(우)
- 모바일: 로고(좌) + 햄버거(우) → 드로어

### Components

**HeroSection**
- Headline: `서울 트라이브가 짜준 하루를 따라가.` (en: `Follow a day designed by Seoul Tribe.`)
- Subline: `동남아 여행자를 위한 현지인 큐레이션 루트` (en: `Local-curated day routes for Southeast Asian travelers.`)
- Hero image: 가로 라인 타임라인 UI 스크린샷 목업 (실제 HaruTimeline 컴포넌트 스크린샷으로 교체 예정)
- Primary CTA: `루트 둘러보기` → `/explore`
- Secondary CTA: `어떻게 동작하나요?` → `/how-it-works`
- 언어별로 headline 표시. LanguageSwitcher 상태와 연동.

**TrustSection**
- 3개 수치 강조 (목업: 샘플 고정값)
  - "50+ Guardians" (Seoul Tribe 가디언 수)
  - "4.9★ 평균 평점"
  - "7개 언어 지원"
- 아이콘 + 수치 + 라벨 구조

**HowItWorksTeaser**
- 3단계 세로 흐름 (숫자 + 아이콘 + 제목 + 한 줄 설명)
  1. "가디언 선택" — 동남아 언어로 소통 가능한 현지인
  2. "하루 루트 의뢰" — 날짜·예산·취향 입력
  3. "따라가면 끝" — 가로 타임라인으로 하루 완성
- "자세히 보기" → `/how-it-works`

**GuardianShowcase**
- 가디언 카드 3개 수평 스크롤 (mock 데이터)
- 각 카드: 가디언 사진 + 이름 + 언어 뱃지 + 샘플 루트 썸네일
- "더 보기" → `/explore`

**PricingTeaser**
- 3티어 카드 (Basic 29K / Standard 59K / Premium 119K)
- Standard를 가운데 강조(Featured)
- "자세히 보기" → `/pricing`

**FinalCTA**
- 다크 블록: "오늘 루트 의뢰하기" → `/explore`
- 하단: "Seoul Tribe이 되고 싶으신가요?" → `/guardian`

### Data
목업: 모든 수치·가디언 카드는 `src/data/mock/` 또는 목표 `src/lib/mock/guardians.ts` 고정 데이터.

```ts
// lib/mock/guardians.ts 예시 구조 (이행 시 경로만 조정)
export const MOCK_GUARDIANS = [
  {
    id: 'guardian-001',
    name: 'Linh Nguyen',
    bio_key: 'guardian_001_bio',
    languages: ['vi', 'ko', 'en'],
    avatar_url: '/mock/avatars/linh.jpg',
    rating: 4.9,
    review_count: 23,
    sample_route_id: 'route-001',
  },
  // ...
];
```

### Interactions
- LanguageSwitcher: 전환 시 URL locale segment 변경 (`/th/`, `/vi/`) + 로컬 쿠키 저장
- Hero CTA hover: 버튼 scale 1.02, 0.15s ease
- GuardianShowcase: 모바일 터치 스크롤, 데스크톱 화살표 버튼
- 스크롤 애니메이션: `prefers-reduced-motion` 체크, 없으면 fadeUp (Foundation 4.1 적용)

### Mock Data

```ts
// lib/mock/landing.ts (이행 시 src/data/mock/landing.ts 등)
export const LANDING_STATS = {
  guardian_count: 52,
  avg_rating: 4.9,
  language_count: 7,
};
```

### Edge Cases
- 로그인 상태로 방문: "Get Started" → "대시보드로" 또는 그대로 `/explore`
- 이미지 로드 실패: avatar는 이니셜 폴백, hero 이미지는 배경색 폴백

### i18n Keys (en 기준, 번역 필요)

```text
landing.hero.headline
landing.hero.subline
landing.hero.cta_primary
landing.hero.cta_secondary
landing.trust.guardian_count
landing.trust.avg_rating
landing.trust.language_count
landing.how.step1_title / step2_title / step3_title
landing.how.step1_desc / step2_desc / step3_desc
landing.guardian_showcase.title
landing.pricing.title
landing.final_cta.traveler
landing.final_cta.guardian
```

---

## M02 — Landing (Guardian)

**목적:** 한국 거주 여성에게 "Seoul Tribe"이 되어 부수입을 얻는 가치를 설득하고, Guardian 신청을 유도.
**릴리즈:** [M] [P]
**경로:** `/guardian`

### 인바운드 / 아웃바운드
- **In:** M01 푸터·CTA, SNS Guardian 모집 광고
- **Out:** `/g/apply` (주 CTA), `/how-it-works#guardian`

### Layout

```text
<MarketingLayout>
  <GuardianHeroSection>
  <BenefitsSection>
  <EarningsSection>
  <FoundingMemberSection>
  <TestimonialSection>
  <ApplicationCTA>
</MarketingLayout>
```

### Components

**GuardianHeroSection**
- Headline: `서울 사는 당신이 Seoul Tribe입니다.`
- Subline: `동남아 여행자에게 당신만의 서울 하루를 팔아보세요. 수수료 없이 시작.`
- Hero image: Guardian이 루트를 작성 중인 모습 (편집기 UI 목업)
- CTA: `Seoul Tribe 신청하기` → `/g/apply`

**BenefitsSection**
- 3가지 이점 카드
  1. 내 시간에 맞게 — 비동기 작업, 본업 병행 가능
  2. 공정한 수익 — 판매가의 80% 직접 수령
  3. 내 감각이 상품 — 내가 알고 있는 서울을 컨텐츠로

**EarningsSection**
- 수익 시뮬레이터 (인터랙티브)
  - 슬라이더: "한 달에 몇 건 판매하고 싶어요?" (1~30)
  - 티어 선택: Basic / Standard / Premium
  - 결과: "예상 월 수령액 OOO원" 자동 계산
  - 계산식: `건수 × 티어가격 × 0.8`
  - 주의문: "세전 금액, 실제 수령액은 정산 조건에 따라 다를 수 있습니다"
- 월 10건 Standard 기준 = 47.2만원 예시 강조

**FoundingMemberSection**
- Founding Member 혜택 4가지 (섹션 06 IA 데이터 기반)
  - 첫 3개월 수수료 15%
  - 월 20만원 최저 수익 보장 (3개월)
  - 평생 Founding Member 뱃지
  - 첫 5건 에디터 리뷰 지원
- "지금 신청하면 Founding Member 자격이 주어집니다"
- 남은 Founding Member 자리 표시 (목업: 23/30)

**ApplicationCTA**
- 다크 블록: `Seoul Tribe 신청하기` → `/g/apply`
- 아래: 심사 기간 안내 (목업: "평균 3-5일 이내 결과 통보")

### Data
- 수익 시뮬레이터: 순수 클라이언트 계산, 서버 불필요
- Founding Member 잔여석: 목업 고정 (23/30)

### Interactions
- 수익 시뮬레이터 슬라이더: 실시간 계산 업데이트 (debounce 불필요, 즉시 반영)
- 티어 선택: 라디오 버튼, 선택 시 계산 즉시 갱신
- 숫자 애니메이션: 수령액 숫자 변경 시 카운트업 (0.3s)

### Edge Cases
- 이미 Guardian 신청 중인 사용자 방문: CTA → "신청 현황 확인" `/g/apply/pending`
- 이미 Guardian 승인된 사용자: CTA → "/g/dashboard"

### i18n Keys

```text
guardian_landing.hero.headline
guardian_landing.hero.subline
guardian_landing.hero.cta
guardian_landing.benefits.title
guardian_landing.benefits.b1_title / b2_title / b3_title
guardian_landing.earnings.title
guardian_landing.earnings.slider_label
guardian_landing.earnings.result_label
guardian_landing.earnings.disclaimer
guardian_landing.founding.title
guardian_landing.founding.remaining
guardian_landing.cta.button
guardian_landing.cta.review_time
```

---

## M04 — How It Works

**목적:** Mai가 "어떻게 돌아가는 거지?"를 이해하고 의심을 걷어내는 신뢰 형성 페이지.
**릴리즈:** [M] [P]
**경로:** `/how-it-works`

### 인바운드 / 아웃바운드
- **In:** M01 HowItWorksTeaser CTA, 헤더 nav
- **Out:** `/explore`, `/pricing`, `/guardian`

### Layout

```text
<MarketingLayout>
  <PageHero title>
  <TravelerFlow>    ← Mai 기준 스텝
  <GuardianFlow>    ← Seoul Tribe 스텝 (아코디언)
  <TrustSignals>
  <BottomCTA>
</MarketingLayout>
```

### Components

**TravelerFlow**
5단계 스텝 카드 (수직, 화살표로 연결):
1. **둘러보기** — 가디언 프로필과 샘플 루트를 로그인 없이 탐색
2. **의뢰하기** — 날짜·예산·언어·관심사를 입력, 티어 선택
3. **기다리기** — 가디언이 24~72시간 내 루트 작성 (진행 상태 실시간 확인)
4. **확인하기** — 가로 타임라인으로 하루 스팟 확인, 1회 무료 수정 요청 가능
5. **따라가기** — 여행 당일 오프라인 사용, 체크인, 실시간 질의(Premium)

각 단계: 아이콘 + 제목 + 2~3줄 설명 + 해당 화면 미니 스크린샷(목업 이미지)

**GuardianFlow**
별도 탭 또는 "Seoul Tribe이 되려면?" 아코디언 펼치기
4단계:
1. 신청 — 샘플 루트 1개 포함 신청서 제출
2. 심사 — 3~5일 내 결과
3. 루트 작성 — 템플릿 에디터로 하루 루트
4. 정산 — 판매 시 80% 월 1회 지급

**TrustSignals**
- "결제 보호" — 가디언 납품 확인 후 정산 (에스크로 구조)
- "개인정보 보호" — 가디언과 트래블러 개인정보 직접 공유 없음
- "품질 보장" — 처음 5건은 에디터 리뷰
- "환불 정책" — 납품 불이행 시 전액 환불

**BottomCTA**
- "지금 루트 의뢰하기" → `/explore`
- "Seoul Tribe 신청" → `/guardian`

### Edge Cases
- 로딩 필요 없음 (정적 페이지)

### i18n Keys

```text
how_it_works.hero.title
how_it_works.traveler.step{1..5}.title
how_it_works.traveler.step{1..5}.desc
how_it_works.guardian.title
how_it_works.guardian.step{1..4}.title
how_it_works.trust.payment_protection
how_it_works.trust.privacy
how_it_works.trust.quality
how_it_works.trust.refund
```

---

## M05 — Pricing

**목적:** 3티어 구조를 명확히 설명해 구매 결정의 마지막 장벽을 제거.
**릴리즈:** [M] [P]
**경로:** `/pricing`

### 인바운드 / 아웃바운드
- **In:** M01 PricingTeaser CTA, 헤더 nav
- **Out:** `/request/new?tier=standard` (CTA 클릭)

### Layout

```text
<MarketingLayout>
  <PageHero>
  <TierCards>
  <ComparisonTable>
  <FAQ snippet>
  <BottomCTA>
</MarketingLayout>
```

### Components

**TierCards**
3카드 수평 배열 (데스크톱) / 수직 스택 (모바일):

| | Basic | **Standard** (추천) | Premium |
|---|---|---|---|
| 가격 | 29,000원 | **59,000원** | 119,000원 |
| 루트 수 | 1일 | 3일 | 최대 7일 |
| 사전 채팅 | 1회 | 1회 | 제한 없음 |
| 수정 요청 | 1회 | 1회 | 무제한 |
| 대체 코스 | — | ✓ | ✓ |
| 여행 중 채팅 | — | — | 3회 |
| 음성 인트로 | — | — | ✓ |

Standard는 Featured 스타일 (배경 어두움, 뱃지 "추천").
각 카드 하단: "의뢰하기" CTA → `/request/new?tier={tier}`

**ComparisonTable**
모바일에서는 축소 (접기/펼치기).
데스크톱에서는 항목을 행으로, 티어를 열로.

**FAQ snippet**
3개 자주 묻는 질문 (아코디언):
- "한국어 못해도 괜찮나요?"
- "마음에 안 들면 환불되나요?"
- "얼마나 걸려요?"

### Interactions
- CTA 클릭 시 `/request/new?tier={tier}` 이동. 로그인 안 됐으면 `/login?redirect=/request/new?tier={tier}`.
- 아코디언: 클릭 시 부드럽게 확장 (height animation)

### i18n Keys

```text
pricing.hero.title
pricing.hero.subtitle
pricing.tier.basic.title / standard.title / premium.title
pricing.tier.{tier}.feature.{n}
pricing.tier.{tier}.cta
pricing.faq.q{1..3}
pricing.faq.a{1..3}
```

---

## A01 — Login

**목적:** 최소한의 마찰로 Mai를 인증. 이메일 OTP(비밀번호 없음)와 Google OAuth를 지원.
**릴리즈:** [M] [P]
**경로:** `/login`

### 인바운드 / 아웃바운드
- **In:** 인증 필요 화면에서 리다이렉트 (`?redirect={path}` 파라미터)
- **Out:** `redirect` 파라미터 경로 (기본 `/explore`) / `/signup` (신규 가입 링크)

### Layout

```text
<AuthLayout>   ← 흰/크림 배경, 로고 중앙, 언어 전환 상단
  <LoginCard>
</AuthLayout>
```

AuthLayout: 로고 + 카드 중앙 정렬. 배경 `--bg`. 좌측 또는 상단에 언어 전환.

### Components

**LoginCard**

```text
[KSM 로고]
[제목] "로그인"

[이메일 입력 필드]
[이메일로 로그인 버튼] → OTP 전송 → /verify?email={encoded}&redirect={redirect}

[또는 구분선]

[Google로 로그인 버튼]

[아래 텍스트] "계정이 없으신가요? [가입하기]" → /signup?redirect={redirect}
```

- 이메일 필드: `type="email"`, placeholder `your@email.com`
- 이메일 로그인 버튼: 클릭 시 loading, Supabase `signInWithOtp()` 호출
- Google 버튼: Supabase `signInWithOAuth({ provider: 'google' })`
- 로그인 후 `redirect` 파라미터 경로로 이동 (없으면 `/explore`)

### Data
- Supabase Auth 직접 호출 (Server Action)
- `redirect` 파라미터 값 검증: 외부 URL 금지 (`startsWith('/')` 체크)

### Interactions
- 이메일 입력 후 Enter → 버튼 클릭과 동일
- 이메일 로그인 성공: "이메일을 확인해주세요" toast + `/verify?email=...` 이동
- Google OAuth: 팝업 또는 리다이렉트 (Supabase 설정에 따라)
- 이미 로그인 상태로 접근: 자동으로 `redirect` 경로 이동

### Edge Cases
- 잘못된 이메일 형식: 폼 인라인 에러 (제출 전 blur 시 검증)
- OTP 전송 실패 (rate limit): "잠시 후 다시 시도해주세요" toast
- 네트워크 에러: retry 버튼

### i18n Keys

```text
auth.login.title
auth.login.email_placeholder
auth.login.email_button
auth.login.divider
auth.login.google_button
auth.login.signup_link
auth.login.otp_sent
auth.error.invalid_email
auth.error.rate_limit
auth.error.network
```

---

## A02 — Signup

**목적:** 신규 사용자 계정 생성. 이메일 + 이름 + 기본 역할(Traveler) 설정.
**릴리즈:** [M] [P]
**경로:** `/signup`

### 인바운드 / 아웃바운드
- **In:** A01 "가입하기" 링크
- **Out:** `/verify?email={email}&redirect={redirect}`

### Layout
A01과 동일한 AuthLayout.

### Components

**SignupCard**

```text
[KSM 로고]
[제목] "시작하기"

[이름 입력] placeholder "이름을 입력해주세요"
[이메일 입력]
[이메일로 가입 버튼]

[또는 구분선]

[Google로 가입 버튼]

[이용약관 동의 체크박스]
"[이용약관]과 [개인정보 처리방침]에 동의합니다"

[아래 텍스트] "이미 계정이 있으신가요? [로그인]" → /login?redirect={redirect}
```

- 역할 선택 UI 없음. 기본 Traveler 생성. Guardian 전환은 별도 신청 플로우.
- 약관 동의 체크 안 하면 버튼 disabled

### Data
- Supabase `signUp()` 또는 OTP (이메일 확인 후 계정 생성)
- 이름은 `user_metadata.full_name`으로 저장

### Interactions
- 약관 동의 없이 버튼 클릭 시도: 체크박스 흔들림 애니메이션 + 에러 텍스트
- 가입 성공: A01과 동일하게 OTP 전송 → `/verify`

### Edge Cases
- 이미 가입된 이메일로 시도: "이미 가입된 이메일입니다. [로그인하기]" (Supabase 에러 처리)
- Google 계정이 이미 연결된 경우: 로그인으로 전환

### i18n Keys

```text
auth.signup.title
auth.signup.name_placeholder
auth.signup.email_placeholder
auth.signup.button
auth.signup.terms_label
auth.signup.terms_link
auth.signup.privacy_link
auth.signup.login_link
auth.error.email_exists
```

---

## A04 — Onboarding

**목적:** 신규 가입 직후 Mai의 언어·국가·여행 의도를 수집해 개인화 기반 마련.
**릴리즈:** [M] [P]
**경로:** `/onboarding`

### 인바운드 / 아웃바운드
- **In:** A03(OTP 인증 성공) 직후 자동 이동 (신규 가입자만. `profile.onboarded = false` 조건)
- **Out:** `redirect` 파라미터 경로 (기본 `/explore`)

### Layout

```text
<AuthLayout>
  <OnboardingCard>
    <StepIndicator steps=3 current={step} />
    <StepContent />
    <NavigationButtons prev/next/finish />
  </OnboardingCard>
</AuthLayout>
```

3단계 마법사(Wizard). 각 단계는 슬라이드 전환.

### Components

**Step 1 — 언어 선택**

```text
[제목] "어떤 언어가 편하세요?"
[언어 카드 그리드 2×2]
  - 🇹🇭 ภาษาไทย (Thai)
  - 🇻🇳 Tiếng Việt (Vietnamese)
  - 🇬🇧 English
  - 🇰🇷 한국어
[선택 시 체크 표시, 단일 선택]
```

**Step 2 — 국가 선택**

```text
[제목] "어느 나라에서 오셨어요?"
[국가 목록 드롭다운 또는 검색]
우선 노출 (상단 고정): 태국·베트남·인도네시아·필리핀·말레이시아
나머지: 알파벳 순
```

**Step 3 — 방문 의도**

```text
[제목] "한국 여행은 처음인가요?"
[대형 선택지 2개]
  - "네, 처음이에요 🌸"
  - "아니요, 와봤어요 ✈️"

[선택 시 즉시 다음 단계로 또는 완료]
```

**NavigationButtons**
- 이전: Ghost 버튼 (1단계에서 숨김)
- 다음/완료: Primary 버튼
- "나중에 설정하기" 링크 (우측 상단 또는 하단, 모든 필드 기본값 en/TH/처음으로 설정 후 이동)

### Data
- 완료 시 `profiles` 테이블 upsert:
  - `preferred_language`
  - `country_code`
  - `is_first_visit` (boolean)
  - `onboarded = true`
- 목업: Supabase 연결 없이 localStorage (나중에 실서비스 전환 시 교체)
  - **단, 필드명·구조는 실 Supabase 스키마와 동일**
  - **주의:** Foundation §3.2는 `localStorage` 직접 접근을 금지한다. 목업 전용이며, 본프로덕션 전 **쿠키·서버 액션·프로필 API**로 교체 TODO.

### Interactions
- 언어 카드 클릭 시 강조 + 자동으로 다음 단계로 전환 (300ms 딜레이)
- 국가 선택: 선택 즉시 "다음" 버튼 활성화
- 3단계 선택 즉시 완료 처리
- StepIndicator: 클릭 가능, 이전 단계로 이동 (다음 단계는 클릭 불가)
- 페이지 뒤로 가기 버튼: Step 1이면 `/explore` 이동 (온보딩 건너뜀)

### Edge Cases
- 이미 온보딩 완료한 사용자 직접 접근: `/explore`로 리다이렉트
- 도중 새로고침: Step 1부터 재시작 (진행 상태 URL 파라미터 `?step=2`로 유지)
- "나중에 설정하기": `onboarded = true`, 기본값 저장 후 이동

### i18n Keys

```text
onboarding.step_indicator
onboarding.step1.title
onboarding.step1.lang.th / vi / en / ko
onboarding.step2.title
onboarding.step2.placeholder
onboarding.step3.title
onboarding.step3.first_time
onboarding.step3.returning
onboarding.nav.prev
onboarding.nav.next
onboarding.nav.finish
onboarding.nav.skip
```

---

## 구현 주의사항 공통 (3A)

### 정적 페이지 (M01, M02, M04, M05)
- 모두 React Server Component. `'use client'` 최소화.
- 예외: M02 수익 시뮬레이터, M05 아코디언 (최소 클라이언트 아일랜드로 격리)
- `generateMetadata` 각 페이지별 정의

### 인증 플로우 (A01, A02, A04)
- A01, A02는 이미 로그인 상태에서 접근 시 `/explore`로 리다이렉트 (서버사이드 체크)
- A04는 `onboarded = false` 상태에서만 노출. `onboarded = true`면 즉시 `redirect` 이동
- 모든 `redirect` 파라미터 값: 외부 URL 금지, 반드시 `/`로 시작하는지 검증

### 목업 단계 구현 주의
- 실 Supabase 연결 없이 구현 가능하지만, **컴포넌트·타입·i18n 키는 실서비스 수준으로 작성**
- Mock 데이터는 **`src/lib/mock/`** (목표) 또는 현재 **`src/data/mock/`** 전용 파일, 컴포넌트 내부 하드코딩 금지
- 나중에 mock 모듈 → `lib/supabase/`(실제 클라이언트) 교체로 실서비스 전환

---

## 이 문서 구현 완료 후 리포트 템플릿

```text
## 3A 구현 완료 리포트

### 구현된 화면
- M01 ✓/✗ (미구현 이유)
- M02 ✓/✗
- M04 ✓/✗
- M05 ✓/✗
- A01 ✓/✗
- A02 ✓/✗
- A04 ✓/✗

### 생성된 주요 파일
- path → 역할

### 생성된 공통 컴포넌트
- src/components/ui/xxx.tsx

### 목업 데이터 위치
- src/data/mock/xxx.ts (또는 src/lib/mock/xxx.ts)

### 스펙 대비 변경 사항
- (이유와 함께)

### 3B(Traveler 화면) 진입 전 확인 필요 사항
- (형에게 질문)
```

---

## 문서 버전

- 3A · **1.0** · [IA_SCREEN_INVENTORY.md](./IA_SCREEN_INVENTORY.md) v1.0 기반
- **1.0.1** — `FOUNDATION.md` / `IA_SCREEN_INVENTORY.md` 링크 통일, `src/`·mock 경로·A04 `localStorage` 주의·목업 mock 경로 명시
