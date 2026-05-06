<!-- markdownlint-disable-file MD013 MD022 MD028 MD032 MD036 MD031 -->
# Korea Safe Mate — Foundation Document
## 클로드 코드 작업 시작 전 주입용 · v6 리팩토링

> 이 문서는 Korea Safe Mate(이하 KSM) v6 리팩토링의 **기본 컨텍스트**다.
> 모든 후속 작업(IA, 화면 설계, 기능 구현, 데이터 모델링)은 이 문서의 원칙을 따른다.
> 개별 작업 프롬프트에서 본 문서와 충돌하는 지시가 발생하면, **본 문서가 우선한다.**

> **협업 절차·보고:** AI/인간 공통 작업 흐름·UX·검증·완료 보고는 [AI_DEVELOPMENT_RULES.md](./AI_DEVELOPMENT_RULES.md)를 따른다. 제품·데이터·스택 본문 원칙과 충돌하지 않는 범위에서 적용한다.

> **저장소 메모 (이 워크스페이스):** App Router 실경로는 `src/app/`이다. 환경 변수 샘플은 루트 `env.example`이다. 스캔·갭 리포트 작성 시 문서 본문의 `app/`·`.env.example` 언급은 이 경로·파일명으로 치환해 기술한다. `i18n`은 현재 코드베이스가 `en`/`ko`/`ja`를 사용 중이며, §4.4의 `th`/`vi`는 Foundation 대비 **갭**으로 기록한다.

---

## 0. 프로젝트 현재 상태 (가장 먼저 인지할 것)

### 0.1 레포 상태
- **현재 작업 디렉토리가 v6 프로젝트이며, 그 내용물은 v3 레포를 클론해둔 상태다.**
- 즉, 지금 보이는 모든 파일은 v3 시점의 것이다. v3와 v6의 별도 저장소는 존재하지 않는다.
- 앞으로의 리팩토링은 **이 디렉토리 위에서 이뤄진다.** 외부 레포를 참조하려 하지 말 것.
- v3 원본 상태는 `git tag v3-snapshot` 같은 태그로 보존되어 있다고 가정한다 (없으면 첫 작업 때 생성 제안).

### 0.2 네가 가장 먼저 해야 할 일
코드를 쓰기 전에 **현재 레포 스캔 리포트**를 제출한다. 스캔 대상:
- `package.json` — 의존성·스크립트
- `next.config.js/mjs/ts` — 빌드 설정
- `src/app/` 또는 `app/` 또는 `pages/` 트리 — 라우팅 구조 (이 저장소: **`src/app/`**)
- `src/components/` 또는 `components/` 트리 — 기존 컴포넌트 목록
- `src/lib/`, `utils/`, `src/hooks/` 등 — 공통 모듈
- `supabase/migrations/`, `supabase/seed.sql`, `.sql` 파일 — DB 스키마 현황
- `env.example` 또는 `.env.example` — 필요한 환경 변수 (실 `.env`는 절대 열지 말 것)
- 루트에 있는 문서(README, CHANGELOG, CONTRIBUTING 등)

스캔 결과는 본 Foundation 문서의 원칙과 대조해서 **갭 리포트**로 정리한다 (섹션 10 참조).

### 0.3 작업 모드 선언
너는 KSM v6 리팩토링의 **시니어 풀스택 엔지니어**로 작업한다. 아래 모드를 항상 유지한다.

- **리팩토링은 점진적(incremental)이다.** 기존 v3 코드를 한 번에 날리고 재작성하지 않는다. 기능 단위로 대체한다.
- **기존 파일은 "이어서 수정"이 기본.** 삭제·전면 재작성은 새 패러다임과 충돌하는 경우에만.
- **의심되면 물어본다.** 요구사항이 모호하거나 기존 코드와 충돌할 때, 추측하지 말고 **중단하고 질문**한다.
- **가정은 명시한다.** 구현 전 "나는 X를 가정하고 진행한다"를 반드시 선언한다.
- **테스트 없는 PR은 없다.** 주요 비즈니스 로직(루트 CRUD, 주문 정산, 수수료 계산)은 최소한의 유닛 테스트를 포함한다.

---

## 1. 제품 정체성

### 1.1 한 줄 정의
**Korea Safe Mate는 한국 여행이 막막한 동남아 20대 여성이, 서울 트라이브(현지 가디언)가 짜준 하루를 따라가며 안심하고 서울을 경험하게 하는 C2C 양면 시장 플랫폼이다.**

### 1.2 타겟 페르소나 (1차)

**Primary Persona — "Mai" (23세, 태국 방콕)**
- 첫 해외여행, 한국 K-드라마 팬
- 영어 제한적, 한국어 불가
- 인스타그램·틱톡·소홍슈 소비, 여행 정보 조각으로 수집
- 월 가처분소득 약 15,000 THB (약 60만원)
- 가장 큰 두려움: "택시 바가지, 길 잃음, 혼자 밥 먹기 민망함, 모르는 줄 서는 식당"
- 가장 원하는 것: "누가 딱 정해줬으면 좋겠어. 믿을 만한 현지인이."

모든 화면·카피·데이터는 **Mai의 언어 능력과 불안**을 기준으로 설계한다.

### 1.3 핵심 문제
**"Planning Overwhelm" — 첫 한국 여행, 어디부터 뭐부터 해야 할지 모르겠어.**

### 1.4 수익 모델
- **C2C 수수료 20%** (가디언 판매가의 80%는 가디언 수령)
- 광고·구독 없음. 트래블러는 앱 사용 무료.
- MVP 단일 상품: **맞춤 루트 설계** (29K / 59K / 119K 3티어)

### 1.5 포지셔닝
- **Primary (소비자용):** "서울 트라이브가 짜준 하루"
- **Secondary (내부/투자용):** KimKim(고가 맞춤)과 트리플(막연한 정보) 사이, 대중 가격대의 휴먼 큐레이션

### 1.6 핵심 용어 (Glossary — 코드 전반에서 통일)
- **Traveler**: 루트를 구매하는 동남아 여행객 사용자
- **Guardian**: 루트를 설계·판매하는 한국 거주 현지인 (운영상 "Seoul Tribe"로도 노출됨)
- **Route (= Haru)**: 하루 단위 타임라인. 5~7개 스팟, 이동시간·비용·대체옵션 포함
- **Spot**: 루트 내 개별 방문지 (식당·카페·명소·상점 등)
- **Tier**: 맞춤 루트 설계 상품 등급 (Basic / Standard / Premium)
- **Commission**: 플랫폼 수수료. 기본 20%, Founding Guardian 첫 3개월 15%

UI 카피에서는 상황에 따라 "Guardian" 또는 "Seoul Tribe"를 쓰되, **코드 내부 식별자(테이블·변수·API)는 `guardian`으로 통일**한다.

### 1.7 v3 네이밍과의 관계
현재 코드에 이미 `Guardian`·`guardian`·`GUARDIAN` 등의 식별자가 존재한다면 **그대로 유지**한다. 전면 리네임은 수행하지 않는다.
v3에 존재하지 않던 새 개념(`Traveler`, `Route`, `Spot`, `Order`, `Tier` 등)은 v6 용어집을 따라 신규 생성한다.
v3의 식별자가 v6 용어집과 의미적으로 충돌할 경우(예: v3의 `Guardian`이 사실은 "관리자" 의미였음) — **반드시 작업 전에 질문.** 임의 리네임 금지.

---

## 2. v3 → v6 마이그레이션 방침

### 2.1 현재 보유 자산 (살려둘 것)
현재 레포(구 v3) 안에 존재하는 자산 중 아래는 **기본적으로 보존·재활용**한다:
- Next.js App Router 구조
- Supabase 연결 설정, 기존 테이블과 마이그레이션
- 기존 가디언 프로필·포스트 데이터
- 기존 디자인 토큰(있다면)
- Vercel 배포 설정

스캔 리포트에서 위 항목의 실제 상태를 확인한 뒤 진행한다.

### 2.2 v3에서 해결할 기술 부채 (v6에서 구조적으로 고침)

**a. RLS (Row Level Security) 공백**
- 현재 레포는 RLS가 일부 테이블에만 적용되어 있거나 누락됐을 가능성이 크다
- **v6 원칙: 모든 사용자 데이터 테이블에 RLS를 기본 ON으로 배포한다.** RLS 없는 테이블은 배포 거부.
- `service_role`로 우회하는 API 호출은 서버사이드 전용 라우트(`src/app/api/` Route Handlers 또는 Server Actions)에서만 허용
- 기존 테이블 RLS 적용은 **별도 마이그레이션 파일**로 관리 (원본 테이블 정의 수정 금지)

**b. LLM 할루시네이션 (가짜 스팟 생성)**
- v3는 LLM이 존재하지 않는 식당·카페 이름을 만들어냄
- **v6 원칙: AI 루트 생성은 사전 등록된 `spot_catalog` 테이블의 `id` 참조만 허용.** LLM이 임의 문자열 반환 시 검증 실패 처리.
- `spot_catalog`는 한국관광공사 Tour API + Naver Maps API + 가디언 등록 스팟의 합집합
- 기존에 `v5_spot_cache` 캐싱 레이어가 있다면 이를 발전시켜 사용 (없으면 신규 생성)

**c. JSON 파싱 실패**
- v3는 LLM 응답이 불완전 JSON이면 전체 실패
- **v6 원칙: LLM 응답은 반드시 스키마 검증(Zod) 후 저장.** 검증 실패 시 자동 재시도 1회, 그래도 실패면 명확한 에러 + 부분 결과 복구.

**d. Vercel 타임아웃 (기본 10초, Pro 60초)**
- v3는 루트 생성이 60초를 넘어서 타임아웃
- **v6 원칙: 모든 장시간 작업은 비동기 처리.** 작업 큐 패턴 (클라이언트가 `job_id` 받고 polling 또는 realtime 구독).
- 루트 생성 요청 → `route_generation_jobs` 레코드 insert → background worker(또는 Supabase Edge Function) 처리 → 완료 시 realtime 이벤트

**e. Multi-LLM Provider Router**
- Gemini / Grok / OpenAI 중 하나 장애 시 자동 failover
- **v6 원칙: Provider 선택은 환경변수 기반 전략 패턴.** 우선순위·재시도 정책을 설정 파일로 분리.

### 2.3 점진적 리팩토링 순서
1. **스캔 & 갭 리포트** (코드 변경 없음)
2. **Git 보존 태그 생성** — v3 상태를 `v3-snapshot` 태그로 고정 (이미 있으면 건너뜀)
3. 데이터 모델 + RLS 보강 (기반 공사, 아래 섹션 5 참조)
4. 공통 컴포넌트 + 디자인 시스템 이관
5. 가로 라인 타임라인 컴포넌트 (v6 핵심 UI)
6. 트래블러 플로우 (탐색 → 구매 → 수령)
7. 가디언 플로우 (프로필 → 루트 작성 → 주문 처리)
8. 결제 + 정산 (목업 단계에서는 mock, 프로덕션에서 활성화)
9. 관리자 도구 (에디터 리뷰, 품질 관리)

**한 번에 한 단계씩.** 이전 단계가 통과되기 전에 다음 단계로 넘어가지 않는다.

### 2.4 구버전 코드 제거 정책
- 기존 파일·라우트·컴포넌트가 v6 방향과 충돌하여 더 이상 쓰이지 않게 되는 경우에도 **즉시 삭제하지 않는다.**
- 대신 `@deprecated` JSDoc 주석과 함께 `/_deprecated/` 폴더 또는 파일명 접두어 `_deprecated_`로 격리
- 완전 삭제는 전체 리팩토링 종료 후, 별도 "cleanup PR"에서 일괄 처리
- 이유: 목업 단계에서 레거시 화면이 임시로 필요할 수 있고, 참조 스니펫으로도 유용하기 때문

---

## 3. 기술 스택

### 3.1 확정 스택
- **Runtime**: Node.js 20+ LTS
- **Framework**: Next.js 14+ (App Router, Server Components 우선)
- **Language**: TypeScript 5.x (`strict: true`)
- **Database**: Supabase (Postgres 15+)
- **Auth**: Supabase Auth (Email OTP + Google OAuth)
- **Storage**: Supabase Storage (이미지·음성)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS + CSS Variables (디자인 토큰)
- **UI Primitives**: Radix UI (접근성) + 자체 컴포넌트
- **Forms**: React Hook Form + Zod (폼 검증)
- **State**: React Server Components + URL State 우선. 클라이언트 전역 상태는 Zustand (최소화)
- **i18n**: next-intl (초기 지원: `ko`, `en`, `th`, `vi`)
- **Payment**: Stripe Connect (목업 단계는 mock mode)
- **AI**: OpenAI / Gemini / xAI Grok (Provider 추상화 계층 위에)
- **Validation**: Zod (모든 외부 입력·LLM 출력)
- **Testing**: Vitest (유닛), Playwright (E2E, 핵심 플로우)

**주의:** 위 목록은 v6 목표 스택이다. 현재 레포의 실제 스택과 다를 수 있다.
스캔 리포트에서 차이를 명시하고, **전환이 필요한 항목은 별도 리팩토링 단계로 계획**한다. 지금 한 번에 바꾸지 않는다.

### 3.2 사용 금지 / 주의
- `localStorage` / `sessionStorage` 직접 접근 금지 → `cookies-next` 또는 서버 세션 사용
- 클라이언트 컴포넌트에서 Supabase Service Role Key 사용 금지
- `any` 타입 금지 (`unknown` 후 좁히기)
- 커스텀 훅 이름에 `use` 접두어 강제
- Server Component 안에서 Client-only 라이브러리 import 금지

### 3.3 디렉토리 구조 원칙 (목표)

```text
app/
  (traveler)/        # 트래블러 라우트 그룹
  (guardian)/        # 가디언 라우트 그룹
  (admin)/           # 관리자
  api/               # Route Handlers (서버 전용 로직)
components/
  ui/                # 원자 단위 (Button, Input, Badge)
  patterns/          # 조합 단위 (HaruTimeline, SpotCard, TierCard)
  layout/            # 레이아웃 셸
lib/
  supabase/          # 클라이언트·서버 분리 (server.ts, client.ts)
  ai/                # LLM Provider 추상화
  payment/           # Stripe 래퍼
  validation/        # Zod 스키마
  i18n/              # 로케일·메시지
types/               # 전역 타입 (DB 스키마 자동 생성 포함)
supabase/
  migrations/        # SQL 마이그레이션
  seed/              # Mock 데이터 시드
```

**이행 방식:** 현재 레포의 구조가 위와 다르면, **점진 이관**한다. 한 번에 전체 재배치 금지.
새 파일은 목표 구조에, 기존 파일은 건드릴 때 해당 폴더로 이동 + import 경로 업데이트.
**이 저장소:** 목표 트리의 `app/`·`components/`·`lib/`는 현재 `src/app/`·`src/components/`·`src/lib/`에 대응한다.

---

## 4. 디자인 원칙

### 4.1 핵심 UX 철학
**"한국어·영어 둘 다 불편한 Mai가 3초 안에 무엇을 해야 할지 알 수 있어야 한다."**

모든 화면은 이 기준을 통과해야 한다. 구체적으로:

1. **텍스트보다 이미지/아이콘/순서가 우선**
2. **정보 해석은 시스템이, 선택만 사용자가** (트리플식 "점 찍고 연결" 금지)
3. **진행 상태는 항상 시각적으로 보여준다** (스피너 단독 사용 금지, 스켈레톤 + 진행률)
4. **오류 메시지는 사용자 언어로, 다음 행동까지 제시**
5. **터치 타겟 최소 44×44px** (모바일 우선)

### 4.2 디자인 토큰 (필수 이관)

현재 레포에 디자인 토큰이 이미 있다면 **기존 토큰 위에 아래 값을 덮어쓰거나 추가**한다. 완전 대체하지 않는다.
토큰 정의 위치: 이 저장소에서는 `src/app/globals.css` 등 실제 글로벌 스타일 파일을 스캔해 확인한다. Tailwind 테마(`tailwind.config.ts` 또는 v4 PostCSS 설정)에 연결.

**Color — Surface**
```css
--bg: #F5F1EA;
--bg-card: #FAF7F1;
--bg-sunken: #EFEADF;
--bg-dark: #1A2540;
--bg-dark-soft: #2A3552;
```

**Color — Ink**
```css
--ink: #1A2540;
--ink-muted: #5A6378;
--ink-soft: #8B92A5;
--ink-whisper: #B5BAC9;
```

**Color — Accent**
```css
--accent: #D85A30;
--accent-dark: #993C1D;
--accent-soft: #F4D9CE;
--accent-whisper: #FAECE4;
--gold: #B8894A;
--ok: #3B6D11;
```

**Color — Line**
```css
--line: #D9D1C3;
--line-soft: #E8E2D5;
--line-whisper: #F0EBE0;
```

**Typography — Family**
```css
--font-serif: 'Fraunces', 'Instrument Serif', Georgia, serif;
--font-sans: 'Pretendard Variable', Pretendard, -apple-system, sans-serif;
```

**Typography — Scale (1.25 modular)**
```text
text-2xs  10px | text-xs   11px | text-sm   13px
text-base 15px | text-md   17px | text-lg   20px
text-xl   24px | text-2xl  30px | text-3xl  38px
text-4xl  48px | text-5xl  64px | text-6xl  88px
```

**Spacing (8px 베이스)**
```text
sp-1  4 | sp-2  8  | sp-3  12 | sp-4  16 | sp-5  20
sp-6  24 | sp-8  32 | sp-10 40 | sp-12 48 | sp-16 64
sp-20 80 | sp-24 96 | sp-32 128
```

### 4.3 핵심 컴포넌트 원칙

**`<HaruTimeline>` — 가로 라인 타임라인 (v6 시그니처 컴포넌트)**
- 하루의 스팟을 좌→우 수평 스크롤로 표시
- 스팟 사이 연결선에 이동 시간·거리 노출
- 모바일: 터치 스크롤, 스팟 카드는 뷰포트 폭의 75% 수준
- 데스크톱: 전체 타임라인 한눈에 보이는 "조감 모드"와 세부 모드 전환 가능
- 지도는 기본 숨김, 토글 버튼으로만 노출 ("Safe 브랜드" = 인지 부담 최소화)

이 컴포넌트는 **별도 전용 프롬프트**에서 상세 구현된다. 지금 단계에서는 존재와 원칙만 인식.

### 4.4 다국어(i18n) 원칙
- 기본 로케일: `en` (국제 타겟 우선)
- 지원: `ko` (한국 가디언·관리자), `en` (Primary), `th` (태국), `vi` (베트남)
- 모든 사용자 노출 문자열은 **하드코딩 금지.** 반드시 `t('key')` 호출.
- Mock/샘플 텍스트도 예외 없이 i18n 키로 관리 (나중 실서비스 전환 시 마찰 제거)

---

## 5. 데이터 모델 원칙 (상세는 4단 프롬프트에서)

### 5.1 테이블 명명 규칙
- `snake_case`, 복수형 (`travelers`, `guardians`, `routes`)
- 관계 테이블은 `_` 연결 (`guardian_routes`, `route_spots`)
- 타임스탬프는 `created_at`, `updated_at`, `deleted_at` (soft delete)

### 5.2 RLS 기본 정책
- **모든 테이블 RLS ON.**
- 사용자 데이터: `auth.uid() = owner_id` 정책
- 가디언 공개 프로필: `is_public = true` 조건으로 모두에게 읽기 허용
- 관리자 전용 테이블: 별도 역할 정의 (`admin` role in JWT claim)

### 5.3 기존 테이블과의 관계
현재 레포의 기존 테이블은 **이름을 바꾸지 않는다.**
v6에서 새로 필요한 엔티티만 **신규 마이그레이션**으로 추가하고, 기존 테이블은 ALTER로 컬럼 추가·RLS 강화만 진행한다.
DROP TABLE은 섹션 2.4 정책을 따라 최종 cleanup 단계에서만.

### 5.4 주요 엔티티 (개요만, 상세는 4단에서)
- `travelers`: 트래블러 프로필
- `guardians`: 가디언 프로필 (공개용 필드와 private 분리)
- `routes`: 하루 단위 루트 (가디언 소유)
- `route_spots`: 루트 내 스팟 순서와 메타
- `spot_catalog`: 검증된 스팟 마스터 (LLM 할루시네이션 방지용)
- `orders`: 주문 (트래블러↔가디언 거래)
- `custom_route_requests`: 맞춤 루트 설계 요청
- `reviews`: 거래 후 리뷰
- `route_generation_jobs`: 비동기 루트 생성 작업 큐

현재 레포의 스캔 결과와 겹치는 테이블이 있으면, 4단 프롬프트 시점에 매핑 테이블을 함께 제출한다.

---

## 6. 구현 원칙 (코드 작성 시 항상 지킬 것)

### 6.1 보안
- 모든 mutation은 서버 측에서 권한 검증 후 실행
- 민감 정보는 절대 클라이언트 번들에 포함 금지
- 외부 입력(URL 파라미터, 폼, LLM 응답)은 반드시 Zod 검증

### 6.2 성능
- 이미지는 `next/image` 필수, `sizes` 속성 명시
- 타임라인처럼 스크롤 많은 화면은 가상화 검토
- Server Component가 기본, Client는 인터랙션 필요한 곳만
- DB 쿼리는 인덱스 확인, N+1 금지 (join 또는 `.select('*, relation(*)')`)

### 6.3 에러 처리
- 모든 async 경계에서 try/catch 또는 Result 패턴
- 사용자 대면 에러는 i18n 키로 + 다음 행동 제시
- 개발자용 상세 에러는 `console.error` + 서버 로그(Vercel/Sentry)

### 6.4 접근성
- 모든 interactive 요소는 키보드 접근 가능
- 색상만으로 정보 전달 금지 (아이콘·텍스트 병행)
- `aria-*` 속성 적극 사용
- `prefers-reduced-motion` 존중

### 6.5 국제 결제 준비 (목업 단계에서도)
- 가격은 DB에 `price_krw_cents` (정수 원단위 × 100)
- 환율 변환은 표시 시점에만, 저장은 원화 기준
- 결제 레코드에 `provider`, `provider_transaction_id`, `gross_amount`, `platform_fee`, `guardian_payout` 분리 기록

---

## 7. 작업 프로세스

### 7.1 Git 브랜치 전략
- `main`: v6 리팩토링 작업 기본 브랜치
- `v3-snapshot`: v3 최종 상태 보존 태그 (없으면 첫 작업 때 생성 제안)
- 기능 단위 브랜치: `v6/<area>-<short-desc>` (예: `v6/db-rls-baseline`, `v6/timeline-component`)
- PR은 `main`으로 머지. 스쿼시 머지 기본.

### 7.2 PR 크기
- 한 PR = 한 가지 논리적 변경
- 500 LoC 초과 시 분할 검토
- 생성된 파일(마이그레이션, 타입 자동생성)은 예외

### 7.3 커밋 메시지
Conventional Commits 따름.
```text
feat(guardian): add route draft autosave
fix(api): handle LLM timeout gracefully
refactor(db): move RLS to dedicated migration
chore: update supabase client to 2.x
```

### 7.4 각 작업 시작 시 네가 해야 할 것
1. 관련 **기존 코드 읽기** (현재 레포 내)
2. 가정과 불확실성 명시
3. 영향 범위 선언 (어떤 파일·테이블이 바뀌는가)
4. 작은 단위로 구현 → 셀프 테스트 → 리포트

---

## 8. 출력과 커뮤니케이션

### 8.1 작업 보고 포맷
각 작업 종료 시 다음 형식으로 리포트:

```text
## 변경 요약
- (한 줄로)

## 수정/생성된 파일
- path/to/file.ts — (1줄 설명)

## 기존 파일 영향
- path/to/existing.ts — (어떻게 변경됐는가, 기존 동작이 깨지는가)

## 가정
- (명시적으로 가정한 것)

## 확인 필요
- (내가 판단할 수 없어서 형에게 질문할 것)

## 다음 단계 제안
- (이어서 할 작업)
```

### 8.2 금지 사항
- 요구되지 않은 기능 임의 추가 금지 (스코프 크리프 방지)
- "미래를 위해" 추상화 금지 (YAGNI)
- 주석으로 "이건 임시"라고만 달고 넘어가기 금지 (FIXME/TODO에 날짜와 이유)
- **기존 파일 대규모 리네임 금지** (1.7, 5.3 조항)

---

## 9. 문서 버전

- v6 Foundation · **1.1** (v6 = 클론된 v3 레포 전제 반영)
- 변경 시 본 문서 상단에 changelog 추가

### Changelog
- **1.1** — 초판 (사용자 제공 원문 반영).
- **1.1.1** — 저장소 메모(`src/app/`, `env.example`, i18n 갭), §3.3·§4.2 경로/코드펜스 정리, `src/` 대응 문구 추가.
- **1.1.2** — 후속 2단 문서: [IA_SCREEN_INVENTORY.md](./IA_SCREEN_INVENTORY.md) (IA·화면 인벤토리). §10 완료 후 라우팅·화면 작업에 적용.
- **1.1.3** — 3A 화면 스펙: [SCREEN_SPECS_3A.md](./SCREEN_SPECS_3A.md) (마케팅+Auth). IA §13 승인 후 구현 착수.
- **1.1.4** — 4단 데이터·API: [DATA_MODEL_API.md](./DATA_MODEL_API.md). §10 스캔·기존 마이그레이션 대조 후 착수.

---

## 10. 이 문서를 읽은 뒤 네가 해야 할 것

**이 세 단계가 완료되기 전에는 실제 코드 변경을 시작하지 않는다.**

### 10.1 본 문서 이해 질문 목록 제출
Foundation 문서에서 모호하거나 상충된다고 판단되는 부분을 질문으로 정리.
(예: "기존 파일 A가 v3 `Guardian`을 관리자 의미로 사용하는데, 이것도 유지하나요?")

### 10.2 현재 레포 스캔 & 갭 리포트
다음 포맷으로 제출:

```text
## 현재 레포 스택 스냅샷
- Next.js 버전: ...
- Supabase 클라이언트 버전: ...
- 스타일링: ...
- 기타 주요 의존성: ...

## 현재 라우팅 구조
(app/ 또는 pages/ 트리 요약)

## 현재 DB 스키마
(테이블 목록, 각 테이블별 RLS 적용 여부)

## v6 Foundation 대비 갭
- [ ] 항목 1: 현재 상태 vs v6 목표
- [ ] 항목 2: ...

## 즉시 위험 요소
(보안·데이터 무결성 관점에서 지금 당장 잡아야 할 것)

## 리팩토링 1단계 진입을 위한 질문
(DB 스키마 수정 전 형에게 확인받아야 할 것)
```

### 10.3 리팩토링 순서 중 1단계(데이터 모델 + RLS) 진입 계획서
- 구체적으로 어떤 마이그레이션 파일을 생성할지
- 기존 테이블 중 RLS 미적용된 것 목록
- 신규 추가할 테이블 목록 (섹션 5.4 기반)
- 예상 작업 시간
- 이 계획에 대한 형의 승인을 받고 나서 실행
