<!-- markdownlint-disable-file MD013 MD022 MD028 MD032 MD036 MD031 MD040 MD058 -->
# Korea Safe Mate — IA & Screen Inventory
## 2단 · 정보 구조와 화면 지도 · v1.0

> 이 문서는 KSM v6의 **전체 IA(Information Architecture)와 화면 인벤토리**를 정의한다.
> [Foundation 문서](./FOUNDATION.md)를 먼저 읽고, 그 원칙 위에서 이 문서를 이해할 것.
> 개별 화면 상세 스펙은 3단 프롬프트에서 화면 단위로 제공된다.
>
> **중요:** 본 문서는 목업 시안 + 실서비스 MVP 모두를 커버하는 최대 범위를 다룬다.
> 실제 MVP 릴리즈 범위는 Foundation 섹션 2.3의 점진 리팩토링 순서를 따르며,
> 섹션 11의 **릴리즈 범위 매트릭스**로 관리한다.

> **저장소 메모 (이 워크스페이스):** §3.1의 `app/` 트리는 **목표 구조**다. 실경로는 **`src/app/`**이며 `[locale]`·`(public)`·`(authed)`·`admin` 등 기존 그룹이 이미 있다. §13.2 갭 리포트에서 목표 IA와 1:1 매핑할 것. Mock은 현재 `src/data/mock/` 등 — §13.3의 `lib/mock/`는 이행 목표. i18n은 코드에 `en`/`ko`/`ja`가 있고 §9는 `th`/`vi`를 포함 — **Foundation·IA 갭**에 기록한다.

---

## 0. 이 문서 읽기 전 체크

[Foundation 문서](./FOUNDATION.md)의 섹션 10 절차(레포 스캔·갭 리포트·1단계 진입 계획서)가 완료됐는지 확인한다.
완료되지 않았다면 **이 문서를 구현에 적용하지 말 것.** Foundation 단계부터 순서대로 진행.

완료된 경우에만 본 문서를 기준으로 IA 이관·신규 라우팅 작업에 착수한다.

---

## 1. 사용자 역할 모델

### 1.1 3개 역할
KSM은 3개 역할이 각자 다른 앱처럼 동작한다. 라우트 그룹과 레이아웃이 분리된다.

| 역할 | 정체성 | 주 목표 | 접근 방식 |
|------|--------|---------|-----------|
| **Traveler** | 동남아 20~30대 여성 (Mai) | 안심하고 따라갈 하루 루트 구매 | 공개 → 이메일/OAuth 로그인 |
| **Guardian** | 한국 거주 20~40대 여성 (Seoul Tribe) | 맞춤 루트 판매로 부수입 획득 | 별도 가디언 신청 → 승인 후 활성화 |
| **Admin** | KSM 운영자 (CPO · Head of Guardian Ops) | 품질 관리 · 분쟁 중재 · 정산 확인 | 내부 초대 전용 |

### 1.2 역할 전환 규칙
- 한 계정이 **Traveler + Guardian 겸임 가능** (한국에 사는 동남아 여성이 가디언이 되는 경우).
- Admin은 **Traveler/Guardian과 계정 분리**. Admin 이메일은 별도 도메인 권장.
- 역할 전환은 **명시적 전환 UI** 제공 (우측 상단 아바타 메뉴에서 "Switch to Guardian Mode" 식).
- 역할 정보는 JWT claim에 포함, Supabase RLS 정책의 기준.

### 1.3 게스트 사용자
- **로그인 없이 탐색 가능한 화면이 존재한다** (가디언 프로필 둘러보기, 샘플 루트 미리보기).
- 구매·맞춤 의뢰·메시지는 로그인 필수.
- 게스트 → 로그인 전환 시 **의도(intent) 보존** (예: "이 가디언에게 Standard 의뢰 중이었음" 상태를 로그인 후 복원).

---

## 2. 사용자 여정(User Journey)

### 2.1 Traveler 핵심 여정 — "Mai의 첫 방한 준비"

```text
1. 발견 (SNS 광고 / 지인 추천 / 검색)
   → 공개 랜딩 페이지
     ↓
2. 둘러보기 (로그인 없음)
   → 가디언 카드 리스트
   → 샘플 루트 1~2개 미리보기
     ↓
3. 결심 (맞춤 의뢰 결정)
   → 티어 선택 (Basic/Standard/Premium)
   → 로그인 요구 (이메일 OTP 또는 Google)
     ↓
4. 의뢰 작성 (여행 정보 입력)
   → 날짜 · 인원 · 예산 · 관심사 · 언어 · 특이사항
     ↓
5. 결제 (목업은 mock, MVP는 Stripe)
   → 에스크로 형태: 가디언 납품 확정 후 정산
     ↓
6. 대기 (가디언 작성 중)
   → 진행 상태 추적 화면
   → 가디언과 사전 채팅 1회 가능
     ↓
7. 수령 (루트 납품 확인)
   → 가로 라인 타임라인으로 하루 확인
   → 1회 무료 수정 요청 가능
     ↓
8. 여행 중 (실사용)
   → 오프라인 저장된 루트 열람
   → 스팟별 체크인, 실시간 질의(Premium만)
     ↓
9. 후기 (리뷰 작성)
   → 가디언 평점 + 자유 후기
   → 리뷰 작성 시 다음 의뢰 10% 할인 쿠폰
```

### 2.2 Guardian 핵심 여정 — "서울 사는 베트남 언니의 부업"

```text
1. 신청 (공개 랜딩의 "Become a Seoul Tribe")
   → Guardian 신청서 (거주 증명, 자기소개, 샘플 루트 1개)
     ↓
2. 심사 대기 (Admin 승인)
   → 이메일로 결과 통보 (승인 / 보완요청 / 거절)
     ↓
3. 온보딩 (승인 후)
   → 프로필 작성 가이드
   → 샘플 루트 3개 작성 튜토리얼
   → Founding Member 혜택 안내 (15% 수수료, 최저 수익 보장)
     ↓
4. 프로필 공개
   → Traveler 리스트에 노출 시작
     ↓
5. 의뢰 수신
   → 의뢰 알림 (이메일 + 앱 내)
   → 수락 / 거절 / 추가 질문
     ↓
6. 루트 작성
   → 템플릿 기반 에디터
   → 자동 저장
   → 지도 도구는 보조 (기본은 가로 라인 에디터)
     ↓
7. 납품
   → 미리보기 확인 후 제출
   → 에디터 리뷰 단계 (Founding Member 첫 5건만)
     ↓
8. 수정 대응
   → Traveler의 수정 요청 처리 (1회 무료)
     ↓
9. 정산
   → 월 1회 자동 지급 (Stripe Connect)
   → 대시보드에 수익 내역 공개
```

### 2.3 Admin 핵심 여정

```text
1. 로그인
   ↓
2. 대시보드
   → 신규 Guardian 신청 대기
   → 에디터 리뷰 필요 루트
   → 분쟁 · CS 티켓
     ↓
3. 각 작업
   → 신청 승인/거절
   → 루트 품질 피드백
   → 분쟁 중재 (환불/재작업 결정)
     ↓
4. 리포트
   → 주간 KPI (신규 Traveler, 거래 건수, 평균 평점 등)
```

---

## 3. 라우팅 구조 (Next.js App Router)

### 3.1 최상위 구조

**목표 구조(이행 후).** 현재 레포는 `src/app/[locale]/...` 등이 있으므로 §13.2에서 매핑한다.

```text
app/
├── (marketing)/              # 로그인 없이 접근 가능. 공개 마케팅
│   ├── page.tsx              # /  — 랜딩 (Traveler 진입)
│   ├── guardian/page.tsx     # /guardian  — Guardian 신청 안내
│   ├── about/page.tsx        # /about
│   ├── how-it-works/page.tsx # /how-it-works
│   └── layout.tsx
│
├── (traveler)/               # Traveler 인증 필요
│   ├── explore/              # 탐색
│   │   ├── page.tsx          # /explore — 가디언·루트 피드
│   │   └── guardians/[id]/page.tsx  # /explore/guardians/[id]
│   ├── request/              # 맞춤 의뢰
│   │   ├── new/page.tsx      # /request/new
│   │   └── [id]/page.tsx     # /request/[id]
│   ├── orders/               # 주문 내역
│   │   ├── page.tsx          # /orders
│   │   └── [id]/page.tsx     # /orders/[id]
│   ├── routes/               # 구매한 루트
│   │   ├── page.tsx          # /routes
│   │   └── [id]/page.tsx     # /routes/[id]  — 가로 타임라인
│   ├── messages/             # 가디언과의 채팅
│   │   ├── page.tsx          # /messages
│   │   └── [threadId]/page.tsx
│   ├── profile/              # 내 정보
│   │   └── page.tsx          # /profile
│   └── layout.tsx
│
├── (guardian)/               # Guardian 인증 필요
│   ├── dashboard/page.tsx    # /g/dashboard
│   ├── profile/              # 가디언 프로필 관리
│   │   └── edit/page.tsx     # /g/profile/edit
│   ├── routes/               # 내가 만든 루트들
│   │   ├── page.tsx          # /g/routes
│   │   ├── new/page.tsx      # /g/routes/new
│   │   └── [id]/edit/page.tsx
│   ├── orders/               # 받은 의뢰
│   │   ├── page.tsx          # /g/orders
│   │   └── [id]/page.tsx     # /g/orders/[id]
│   ├── earnings/page.tsx     # /g/earnings — 수익 대시보드
│   ├── messages/             # 트래블러와의 채팅 (공유 스레드 시스템)
│   │   └── [threadId]/page.tsx
│   └── layout.tsx
│
├── (admin)/                  # Admin 전용
│   ├── dashboard/page.tsx    # /admin
│   ├── applications/         # Guardian 신청 심사
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── reviews/              # 에디터 리뷰
│   │   ├── page.tsx
│   │   └── [routeId]/page.tsx
│   ├── disputes/page.tsx     # 분쟁
│   ├── reports/page.tsx      # 운영 리포트
│   └── layout.tsx
│
├── (auth)/                   # 로그인·회원가입
│   ├── login/page.tsx        # /login
│   ├── signup/page.tsx       # /signup
│   ├── verify/page.tsx       # /verify — OTP 입력
│   ├── onboarding/page.tsx   # /onboarding — 언어·국가 등 초기 설정
│   └── layout.tsx
│
├── api/                      # Route Handlers (서버 전용 로직)
│   ├── ai/generate-route/route.ts
│   ├── orders/route.ts
│   ├── payments/webhook/route.ts
│   └── ...
│
├── [locale]/                 # i18n: /en/..., /ko/..., /th/..., /vi/...
│   └── (위 구조가 이 아래로 들어감 — next-intl 적용 방식에 따라)
│
├── globals.css               # 디자인 토큰
├── layout.tsx                # 루트 레이아웃
└── not-found.tsx             # 404
```

### 3.2 경로 네이밍 규칙
- **Traveler 기본 경로는 prefix 없음** (`/explore`, `/orders`). Mai가 가장 많이 볼 URL이므로 짧게.
- **Guardian은 `/g/` prefix** (`/g/dashboard`, `/g/routes`). "Guardian-only" 임을 URL에서도 드러냄.
- **Admin은 `/admin/` prefix**. 검색엔진 노출 방지(`robots.txt`, `x-robots-tag`).
- **i18n**은 locale segment로 (`/th/explore`, `/vi/explore`). 기본(en)은 prefix 생략 또는 유지, next-intl 설정에 따라.

### 3.3 인증 가드
- `(traveler)/`, `(guardian)/`, `(admin)/` 레이아웃에서 **서버사이드 인증 체크**.
- 미인증 시 `/login?redirect={current_path}` 로 리다이렉트.
- 역할 불일치 시 (Traveler가 `/g/*` 접근) → `/403` 또는 역할 전환 유도 화면.

### 3.4 Deep Link 정책
- 모든 주요 리소스는 공유 가능한 deep link 존재
- `/explore/guardians/{id}` — 가디언 프로필
- `/routes/{id}?share={token}` — 트래블러가 친구에게 루트 공유 (조회 전용)
- 공유 링크로 진입 시 게스트도 **요약 뷰** 볼 수 있음, 전체 뷰는 로그인 후

---

## 4. 전체 화면 인벤토리

### 4.1 공개 마케팅 (Marketing)
| ID | 경로 | 이름 | 목적 |
|----|------|------|------|
| M01 | `/` | Landing (Traveler 진입) | 첫 인상 + Mai 설득 |
| M02 | `/guardian` | Landing (Guardian 진입) | 가디언 모집 |
| M03 | `/about` | About | 브랜드 스토리 |
| M04 | `/how-it-works` | How It Works | Traveler용 3분 설명 |
| M05 | `/pricing` | Pricing | 티어별 가격·포함 사항 |
| M06 | `/faq` | FAQ | |
| M07 | `/legal/terms`, `/legal/privacy` | 약관·개인정보 | |

### 4.2 인증 (Auth)
| ID | 경로 | 이름 | 목적 |
|----|------|------|------|
| A01 | `/login` | Login | 이메일 OTP + Google |
| A02 | `/signup` | Signup | 이메일 입력 + 역할 선택(Traveler 기본) |
| A03 | `/verify` | OTP Verify | 이메일로 받은 코드 입력 |
| A04 | `/onboarding` | Onboarding | 언어·국가·첫 방문 여부 |
| A05 | `/logout` | Logout (action, 화면 아님) | |

### 4.3 Traveler
| ID | 경로 | 이름 | 목적 |
|----|------|------|------|
| T01 | `/explore` | Explore Feed | 가디언·샘플 루트 피드 |
| T02 | `/explore/guardians/[id]` | Guardian Profile | 가디언 개인 프로필 + 샘플 루트 |
| T03 | `/explore/routes/[id]` | Sample Route Preview | 샘플 루트 미리보기 (게스트도 요약 접근) |
| T04 | `/request/new` | Custom Request Form | 맞춤 의뢰 작성 (티어 선택 포함) |
| T05 | `/request/[id]` | Request Status | 의뢰 진행 상태 추적 |
| T06 | `/checkout` | Checkout | 결제 (목업에서는 mock) |
| T07 | `/orders` | My Orders | 주문 내역 |
| T08 | `/orders/[id]` | Order Detail | 주문 상세 + 영수증 |
| T09 | `/routes` | My Routes | 구매·수령한 루트 목록 |
| T10 | `/routes/[id]` | Route View (Timeline) | **가로 라인 타임라인 — v6 시그니처** |
| T11 | `/routes/[id]/revision` | Revision Request | 수정 요청 |
| T12 | `/routes/[id]/map` | Map Toggle | 지도 모드 (부가) |
| T13 | `/messages` | Message Inbox | 가디언과의 채팅 목록 |
| T14 | `/messages/[threadId]` | Message Thread | 채팅 상세 |
| T15 | `/reviews/new?orderId=...` | Review Write | 리뷰 작성 |
| T16 | `/profile` | My Profile | 이름·언어·국가 등 |
| T17 | `/profile/settings` | Settings | 알림·언어 설정 |

### 4.4 Guardian
| ID | 경로 | 이름 | 목적 |
|----|------|------|------|
| G01 | `/g/apply` | Guardian Application | 신청서 (인증 필요) |
| G02 | `/g/apply/pending` | Application Pending | 심사 대기 화면 |
| G03 | `/g/dashboard` | Guardian Dashboard | 진행 중 의뢰·이번 달 수익 |
| G04 | `/g/profile/edit` | Edit Profile | 가디언 프로필 편집 |
| G05 | `/g/routes` | My Routes | 내가 만든 루트 목록 |
| G06 | `/g/routes/new` | Create Route (from scratch) | 샘플 루트 작성 |
| G07 | `/g/routes/[id]/edit` | Edit Route | 루트 편집기 |
| G08 | `/g/orders` | Received Orders | 받은 의뢰 목록 |
| G09 | `/g/orders/[id]` | Order Workspace | 의뢰 상세 + 루트 제작 워크스페이스 |
| G10 | `/g/earnings` | Earnings | 수익 대시보드 |
| G11 | `/g/messages/[threadId]` | Messages (Guardian side) | 트래블러와의 채팅 |
| G12 | `/g/help` | Guardian Help Center | 가이드·FAQ·지원 |

### 4.5 Admin
| ID | 경로 | 이름 | 목적 |
|----|------|------|------|
| AD01 | `/admin` | Admin Dashboard | 대기 중 작업 요약 |
| AD02 | `/admin/applications` | Guardian Applications | 신청 심사 대기 목록 |
| AD03 | `/admin/applications/[id]` | Application Detail | 신청서 상세 + 승인/거절 |
| AD04 | `/admin/reviews` | Editor Reviews | 품질 리뷰 필요 루트 목록 |
| AD05 | `/admin/reviews/[routeId]` | Review Workspace | 루트 리뷰 + 피드백 전송 |
| AD06 | `/admin/disputes` | Disputes | 분쟁 목록 |
| AD07 | `/admin/disputes/[id]` | Dispute Detail | 분쟁 상세 + 판정 |
| AD08 | `/admin/reports` | Ops Reports | 주간 KPI |
| AD09 | `/admin/users` | User Management | |

### 4.6 시스템 화면
| ID | 경로 | 이름 | 목적 |
|----|------|------|------|
| S01 | `/404` | Not Found | |
| S02 | `/500` | Server Error | |
| S03 | `/403` | Forbidden | 역할 불일치 |
| S04 | `/maintenance` | Maintenance Mode | |

---

## 5. 공통 레이아웃 & 셸

### 5.1 Traveler Shell
- **Top bar (모바일)**: 로고 + 검색 아이콘 + 알림 + 아바타
- **Bottom nav (모바일)**: Explore · My Routes · Messages · Profile (4개, 아이콘+라벨)
- **Desktop**: 왼쪽 사이드 네비게이션 (Explore, My Routes, Orders, Messages, Profile)
- **Floating help**: 우측 하단 도움말 버튼 (영어/태국어/베트남어 지원 안내)

### 5.2 Guardian Shell
- **Top bar**: 로고(좌) + 역할 토글 [Guardian▾] + 알림 + 아바타
- **Side nav (desktop)**: Dashboard · Orders · Routes · Earnings · Messages · Help
- **Mobile bottom nav**: Dashboard · Orders · Routes · Messages
- **상단 배너**: 미납품 의뢰 마감 임박 경고, 첫 5건 에디터 리뷰 안내 등 상황형

### 5.3 Admin Shell
- 데스크톱 전용 (모바일 비지원). 좌측 사이드 메뉴 + 상단 글로벌 검색.

### 5.4 공통 UI 요소
| 요소 | 배치 | 트리거 |
|------|------|--------|
| **Toast** | 하단 중앙 (모바일) / 우측 상단 (데스크톱) | 성공·정보·경고·에러 4단계 |
| **Modal** | 중앙 오버레이 | 확인·선택 다이얼로그 |
| **Sheet (Bottom)** | 하단에서 슬라이드 (모바일) | 필터·옵션 선택 |
| **Drawer** | 좌/우에서 슬라이드 | 상세 뷰 (데스크톱 위주) |
| **Skeleton** | 로딩 중 콘텐츠 자리 | 로딩 상태 (스피너 단독 금지 — Foundation 4.1) |
| **Empty State** | 리스트·카드 비어있을 때 | 일러스트 + 다음 행동 CTA |

---

## 6. 핵심 전환(Navigation Flow)

주요 화면 간 이동 관계를 그래프로 설명한다. 3단 화면별 스펙에서 각 화면의 **inbound/outbound links**를 이 그래프 기준으로 정의한다.

### 6.1 Traveler 플로우

```text
/ (Landing)
 ├─→ /explore (로그인 없이 둘러보기)
 │     ├─→ /explore/guardians/[id]
 │     │     └─→ /request/new?guardianId=[id]&tier=standard
 │     │           ├─(로그인 필요)→ /login?redirect=/request/new?...
 │     │           └─→ /checkout → /request/[id] (대기)
 │     │                             └─→ /routes/[id] (납품 후)
 │     │                                   ├─→ /routes/[id]/revision
 │     │                                   ├─→ /routes/[id]/map
 │     │                                   └─→ /reviews/new
 │     └─→ /explore/routes/[id] (샘플)
 └─→ /guardian (가디언 신청으로 전환)
```

### 6.2 Guardian 플로우

```text
/guardian (Landing)
 └─(로그인)→ /g/apply → /g/apply/pending
                          └─(승인)→ /g/dashboard
                                      ├─→ /g/profile/edit
                                      ├─→ /g/routes/new (샘플 작성)
                                      └─→ /g/orders/[id] (의뢰 수신 시)
                                            └─→ /g/orders/[id] (작성중)
                                                  └─→ [납품 제출]
                                                        ├─(에디터 리뷰 필요)→ Admin AD05
                                                        └─(통과)→ Traveler에게 전달
```

### 6.3 Admin 플로우

```text
/admin
 ├─→ /admin/applications → /admin/applications/[id] (승인/거절)
 ├─→ /admin/reviews → /admin/reviews/[routeId] (피드백)
 ├─→ /admin/disputes → /admin/disputes/[id]
 └─→ /admin/reports
```

---

## 7. 상태 관리 경계

각 상태를 어디에 저장할지 혼동 없이 결정하기 위한 규칙.

### 7.1 URL State (가장 우선)
공유 가능·북마크 가능·새로고침에도 살아남아야 하는 상태.
- 필터 (`?category=food&language=th`)
- 페이지네이션 (`?page=2`)
- 탭 (`?tab=upcoming`)
- 의뢰 작성 중 단계 (`?step=3`) — 단, 폼 값은 아님
- 모달 열림 상태 (`?modal=tier-selection`) — 공유해도 같은 UI 재현 가능

### 7.2 Server State (Supabase)
사용자·거래·콘텐츠 등 영구 데이터. React Server Component + Supabase 클라이언트로 fetch.

### 7.3 Client State (Zustand, 최소화)
UI 임시 상태 중 URL에 넣기 애매한 것.
- 드롭다운 열림 여부
- 다단계 폼의 임시 값 (제출 전)
- 낙관적 업데이트 중인 데이터
- **사용 최소화.** useState로 충분한 건 Zustand 금지.

### 7.4 Form State (React Hook Form)
의뢰 작성, 프로필 편집, 루트 편집 등 큰 폼.
- Zod 스키마로 validation
- 자동 저장 필요한 경우 (루트 편집 등) **`draft` 테이블에 주기적 저장**

### 7.5 Cookie (서버 세션)
- Supabase Auth 세션 (자동 관리)
- 로케일 선호도 (`NEXT_LOCALE`)
- **사용자 식별 가능 정보 쿠키 저장 금지**

---

## 8. 에러·빈상태·로딩 처리

### 8.1 로딩
- **첫 진입 페이지 단위**: `loading.tsx`로 스켈레톤 렌더
- **리스트 갱신**: 리스트 상단 프로그레스 바 + 기존 데이터 유지
- **폼 제출**: 버튼 disabled + 스피너, 취소 가능해야 함 (네트워크 8초 이상 대기 시 cancel 버튼)
- **장시간 작업 (루트 생성)**: 별도 진행 상태 화면 (`/request/[id]`) + realtime 구독

### 8.2 빈 상태 (Empty State)
모든 리스트 화면은 **반드시** empty state 디자인을 가진다.
- 일러스트 또는 중립 아이콘
- "아직 X가 없어요" 문구
- **다음 행동 제안 CTA** (빈 리스트에서 사용자가 뭘 해야 하는지)
- 예: `/orders` 빈 상태 → "아직 주문이 없네요. [가디언 둘러보기]"

### 8.3 에러 상태
- **클라이언트 에러 (4xx)**: 인라인 표시, 사용자 언어로, 다음 행동 제안
- **서버 에러 (5xx)**: 페이지 레벨 error.tsx, "다시 시도" 버튼 + "문제 지속 시 고객센터" 안내
- **네트워크 에러**: 자동 재시도(2회) 후 실패 시 사용자에게 노출
- **결제 실패**: 전용 에러 플로우 (재시도, 다른 수단, 고객센터)

### 8.4 권한 에러
- **미인증** → `/login?redirect=`
- **역할 불일치** → `/403` + 역할 전환 CTA
- **리소스 권한 없음 (RLS)** → 404처럼 처리 (리소스 존재 자체 비노출)

---

## 9. i18n 정책

### 9.1 언어별 역할
| 언어 | 주 사용자 | 기본 |
|------|-----------|------|
| `en` | Traveler (국제 기본) | ✓ |
| `ko` | Guardian + Admin | |
| `th` | Traveler (태국) | |
| `vi` | Traveler (베트남) | |

### 9.2 화면별 기본 로케일
- Traveler 화면: `en` 기본, 브라우저 `Accept-Language`로 자동 전환
- Guardian 화면: `ko` 기본 (한국 거주 가정)
- Admin 화면: `ko` 고정

### 9.3 콘텐츠 번역 정책
- **UI 텍스트**: i18n 키 관리 (전체 번역 필수)
- **가디언 작성 콘텐츠 (루트 설명, 프로필 바이오)**: 원문 언어로 저장, 자동 번역 보조 제공
- **자동 번역 보조**: Traveler가 "Translate" 버튼 누르면 기계 번역 결과 표시 (번역 품질 disclaimer 포함)

---

## 10. SEO & 공유 정책

### 10.1 공개 화면 (검색 노출)
- `/`, `/guardian`, `/about`, `/how-it-works`, `/pricing`, `/faq`
- `/explore` (단, 개별 가디언 프로필은 별도 정책)
- `/explore/guardians/[id]` (가디언 동의 시)

### 10.2 비노출 화면
- 모든 `(traveler)/`, `(guardian)/`, `(admin)/` 라우트
- `robots.txt` + `x-robots-tag: noindex` 헤더

### 10.3 메타데이터
- `generateMetadata` 활용, 각 화면별 title/description/og 이미지
- Open Graph 이미지는 자동 생성 (Vercel OG) — 브랜드 일관성 보장

---

## 11. 릴리즈 범위 매트릭스

각 화면을 **목업 시안 · MVP 프로덕션** 기준으로 라벨링. 클로드 코드는 이 표를 기준으로 작업 우선순위를 정한다.

범례: **[M]** 목업 시안에 포함 · **[P]** 프로덕션 MVP에 포함 · **[L]** Later (Phase 2+)

### 11.1 Marketing
| ID | M | P | L |
|----|---|---|---|
| M01 Landing (Traveler) | ✓ | ✓ | |
| M02 Landing (Guardian) | ✓ | ✓ | |
| M03 About | | ✓ | |
| M04 How It Works | ✓ | ✓ | |
| M05 Pricing | ✓ | ✓ | |
| M06 FAQ | | ✓ | |
| M07 Legal | | ✓ | |

### 11.2 Auth
| ID | M | P | L |
|----|---|---|---|
| A01 Login | ✓ | ✓ | |
| A02 Signup | ✓ | ✓ | |
| A03 Verify OTP | | ✓ | |
| A04 Onboarding | ✓ | ✓ | |

### 11.3 Traveler
| ID | M | P | L | 비고 |
|----|---|---|---|------|
| T01 Explore Feed | ✓ | ✓ | | 목업은 샘플 데이터 고정 |
| T02 Guardian Profile | ✓ | ✓ | | |
| T03 Sample Route Preview | ✓ | ✓ | | |
| T04 Custom Request Form | ✓ | ✓ | | |
| T05 Request Status | ✓ | ✓ | | |
| T06 Checkout | ✓ | ✓ | | 목업은 mock |
| T07 My Orders | | ✓ | | |
| T08 Order Detail | | ✓ | | |
| T09 My Routes | ✓ | ✓ | | |
| **T10 Route View (Timeline)** | ✓ | ✓ | | **v6 시그니처** |
| T11 Revision Request | | ✓ | | |
| T12 Map Toggle | | ✓ | | |
| T13 Messages Inbox | | ✓ | | |
| T14 Messages Thread | | ✓ | | |
| T15 Review Write | | ✓ | | |
| T16 Profile | | ✓ | | |
| T17 Settings | | ✓ | | |

### 11.4 Guardian
| ID | M | P | L | 비고 |
|----|---|---|---|------|
| G01 Application | | ✓ | | |
| G02 Pending | | ✓ | | |
| G03 Dashboard | ✓ | ✓ | | |
| G04 Profile Edit | | ✓ | | |
| G05 My Routes | ✓ | ✓ | | |
| G06 Create Route | ✓ | ✓ | | |
| G07 Edit Route | ✓ | ✓ | | |
| G08 Received Orders | ✓ | ✓ | | |
| G09 Order Workspace | ✓ | ✓ | | |
| G10 Earnings | | ✓ | | |
| G11 Messages | | ✓ | | |
| G12 Help Center | | | ✓ | |

### 11.5 Admin
| ID | M | P | L |
|----|---|---|---|
| AD01 Dashboard | | ✓ | |
| AD02 Applications | | ✓ | |
| AD03 Application Detail | | ✓ | |
| AD04 Editor Reviews | | ✓ | |
| AD05 Review Workspace | | ✓ | |
| AD06~09 Disputes / Reports / Users | | | ✓ |

**목업 시안 스코프 = 위 표의 M 컬럼 합집합 (약 20화면).**
이 스코프로 의사결정자 설득이 끝난 뒤, P 컬럼 나머지와 L 컬럼이 순차 활성화된다.

---

## 12. 핵심 유스케이스 시퀀스 (3단 화면 스펙의 근거)

아래 시퀀스는 3단 화면 상세 스펙이 참조할 **맥락 시나리오**다.

### 12.1 "Mai의 첫 구매" 시퀀스

```text
게스트 → M01 Landing
  → T01 Explore (로그인 없음)
    → T02 Guardian Profile (마음에 드는 가디언 발견)
      → [Request Standard] 클릭
        → A01 Login (이메일 OTP)
          → A04 Onboarding (언어: th, 국가: TH, 첫 방문: Yes)
            → T04 Custom Request Form (사전 입력값 복원)
              → T06 Checkout (mock 결제)
                → T05 Request Status (대기, realtime 구독)
                  → [가디언 납품] realtime 이벤트
                    → T10 Route View (가로 타임라인)
```

### 12.2 "Guardian 첫 납품" 시퀀스

```text
가디언 이메일 → G08 Received Orders ([신규 의뢰] 뱃지)
  → G09 Order Workspace
    → [사전 채팅 1회] T/G Messages
    → [루트 작성 시작]
      → 편집기 (G09 내부)
        → 자동 저장 (5초마다 draft)
          → [미리보기] → [제출]
            → [에디터 리뷰 단계] (첫 5건만)
              → AD05 Editor Review Workspace
                → [통과] Traveler에게 전달
```

### 12.3 "수정 요청 → 재납품" 시퀀스

```text
T10 Route View → [수정 요청] → T11 Revision Request
  → [사유 입력 + 스팟 지정]
    → Guardian G09 Order Workspace ([수정 요청됨] 상태)
      → 편집 → 재제출
        → Traveler realtime 알림
          → T10 Route View (업데이트된 버전)
```

---

## 13. 이 문서를 읽은 뒤 네가 해야 할 것

**이 세 단계가 완료되기 전에는 실제 라우팅·화면 구현을 시작하지 않는다.**

### 13.1 IA 이해 질문 목록 제출
본 문서에서 모호하거나 상충된다고 판단되는 부분을 질문으로 정리.

예시:
- "T10(Route View)에서 Premium 티어의 '여행 중 채팅 3회'는 기존 T14 Messages와 같은 스레드에서 처리하나요, 별도 카운터가 필요한가요?"
- "Guardian이 Traveler 역할도 겸임할 때 `/g/dashboard`와 `/explore`를 어떻게 전환하나요?"

### 13.2 현재 레포 라우팅 갭 리포트
Foundation 섹션 10의 스캔 리포트 위에 다음을 추가:

```text
## 현재 레포 라우팅 현황 vs v6 목표 IA
(이 저장소: `src/app/` 트리로 작성)

### 이미 존재하는 라우트 (재활용 가능)
- src/app/... — 기존 용도 → v6에서 매핑될 화면

### 존재하지만 v6와 충돌하는 라우트
- src/app/... — 충돌 이유 → 권장 대응 (rename / deprecate / refactor)

### v6에서 신규 필요한 라우트
- (섹션 3.1 트리에서 현재 없는 것들)

### 라우트 그룹 재배치 필요성
- (traveler) / (guardian) / (admin) 그룹이 없다면 이관 계획
```

### 13.3 MVP 시안 스코프 작업 계획서
섹션 11의 **[M] 목업 시안 컬럼**에 해당하는 화면만 추려서:

```text
## 목업 시안 대상 화면 (약 20개)
- M01, M02, M04, M05, A01, A02, A04, T01, T02, T03, T04, T05, T06, T09, T10, G03, G05, G06, G07, G08, G09

## 작업 순서 제안
1. 공통 레이아웃 셸 (Traveler Shell, Guardian Shell) — 섹션 5.1, 5.2
2. 공통 UI 원자 (Button, Card, Badge 등)
3. HaruTimeline 컴포넌트 (T10의 핵심)
4. Marketing 3화면 (M01, M02, M04)
5. Auth 3화면 (A01, A02, A04)
6. Traveler 탐색·의뢰 (T01~T06)
7. Traveler 수령 (T09, T10)
8. Guardian 작성·관리 (G03, G05~G09)

## 샘플 데이터 전략
- Mock 데이터는 목표: `lib/mock/` 하위 — 현재 레포는 `src/data/mock/` 등을 스캔해 기록 후 점진 이관
- 실 Supabase 스키마와 동일한 형태 (나중 실서비스 전환 시 `upsert`로 이관)
- 언어별로 분리 (ko·en·th·vi)

## 예상 작업 단위(PR)별 분할
- (각 PR의 범위·LoC 추정·의존성)
```

이 계획서 승인 후 3단 화면 스펙 프롬프트로 진입.

**참고:** 마케팅+인증 목업 우선 화면의 상세 스펙은 [SCREEN_SPECS_3A.md](./SCREEN_SPECS_3A.md) (3A v1.0)를 본다. 스키마·RLS·API는 [DATA_MODEL_API.md](./DATA_MODEL_API.md) (4단)를 본다.

---

## 14. 문서 버전

- v6 IA · **1.0** · Foundation([FOUNDATION.md](./FOUNDATION.md)) §9 Changelog와 함께 관리한다.
- 변경 시 상단에 changelog 추가

### Changelog

- **1.0** — 초판(사용자 제공 원문).
- **1.0.1** — `FOUNDATION.md` 링크 통일, 저장소 메모(`src/app/`, mock·i18n 갭), §3.1 목표/실경로 구분, 코드펜스 `text` 라벨.
