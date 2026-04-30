<!-- markdownlint-disable-file MD013 -->
# PRODUCT_SPEC — 제품 초안 (Korea SafeMate)

본 문서는 [README.md](./README.md)의 설명과 저장소 내 **실제 라우트·홈 구성**을 바탕으로 한 초안이다. 확정 스펙이 아니며, 불명확한 항목은 TODO로 표시한다. 목표 IA·화면 전체 맵은 [IA_SCREEN_INVENTORY.md](./IA_SCREEN_INVENTORY.md)를 본다(Foundation §10 이후 적용). 마케팅·인증 7화면 상세 스펙은 [SCREEN_SPECS_3A.md](./SCREEN_SPECS_3A.md)(IA §13 승인 후). DB·RLS·API는 [DATA_MODEL_API.md](./DATA_MODEL_API.md)(Foundation §10·기존 스키마 대조 후).

## 1. 제품 한 줄

한국 여행 안전·가이드 매칭을 목표로 하는 **Next.js 웹 앱**: 공개 홈·탐색·가디언·포스트·예약 관련 UI와, 여행자/가디언 마이페이지·관리자 영역이 공존한다. README에는 **v2 기반 초기 안정 베이스**, **모바일 우선·라이트/다크·중립 톤 + 블루 포인트** 방향이 적혀 있다.

## 2. 사용자·로케일

- **로케일:** 영어(기본), 한국어, 일본어 — `src/i18n/routing.ts` (`en` / `ko` / `ja`, `localePrefix: "as-needed"`).
- **URL:** README 기준 기본은 영어 접두 없음, 한국어 `/ko`, 일본어 `/ja`.
- TODO: 역할(여행자·가디언·관리자)별 온보딩·권한 매트릭스를 표로 정리할 것.

## 3. 공개 홈·공통 (README 1차 범위 + 코드)

README의 확인 포인트와 홈 컴포넌트(`src/components/home/home-forty-two-page.tsx` 등) 기준:

- **히어로:** `HomeHeroCarousel`, 스코프 보조 문구는 서버 정책(`hero-scope-note-policy.server`) 연동.
- **빠른 시작:** 지역·무드 탐색 번들 `HomeExploreBundle`.
- **신뢰·후기:** 카드 그리드 + 리뷰 스포트라이트(목 데이터), `/about#traveler-voices` 링크.
- **포스트:** 승인된 서울 지역 포스트 미리보기, `/posts` CTA.
- **헤더:** 라이트/다크 토글(README: 데스크톱 상단·모바일 메뉴 시트).
- **가디언 CTA:** 선택 없을 때 비활성 + 안내(README).

TODO: “추천 가디언”, “준비 중 지역”, “하단 CTA” 등 README 문구와 1:1 대응하는 컴포넌트명·섹션 순서를 코드 주석 또는 본 문서에 매핑할 것.

## 4. 주요 사용자 영역 (라우트 개요)

`src/app` 구조 기준(로케일 접두는 `as-needed` 규칙 적용):

| 영역 | 경로 예시 | 비고 |
|------|-----------|------|
| 공개 | `(public)/about`, `explore`, `explore/[region]`, `guardians`, `guardians/[guardianId]`, `posts`, `posts/[postId]`, `book`, `book/success`, `services`, `login` … | |
| 여행자 허브 | `(public)/traveler/*` | 메시지, 요청, 포인트, 계정, 저장 포스트/가디언 등 |
| 인증 후 | `(authed)/mypage/*`, `matches`, `guardian/*` | 프로필, 포인트, 저장, 가디언 대시보드·포스트·온보딩 등 |
| 관리자 | `/admin/*` | 로케일 접두 없는 별도 트리 |
| API | `src/app/api/**` | 예약, 가디언 프로필/포스트, 여행자 저장·매치, OSRM, **네이버 검색 프록시**(`api/naver/*`, 시크릿 서버 전용), 개발용 mock 로그인 등 |

TODO: 각 플로우의 “해피 패스”와 “외부 서비스 미설정 시” 동작(목 데이터 여부, 에러 UI)을 정리할 것.

### 4.1 하루웨이 탐색·상세 (구현 기준, 2026-04)

- **목록** `/(locale)/explore/routes`: 그리드 카드 — 대표 이미지(`getRouteExploreCardCoverUrl`: 로컬 커버 → 대표 스팟 갤러리 1장 → 히어로), 태그 최대 3개, 제목·요약 1줄, **지역 라벨 + 대표 실장소 스팟 1~2개**, 거리(km)·예상 시간(120분 미만은 분)·하루이. 스팟 개수는 커버 배지로 표시.
- **상세** `/posts/[id]`: Hero 아래 `RouteDayPreview`(거리·시간·난이도·추천 대상·핵심 분위기·`route_highlights` 첫 줄 주의). 스팟 행은 현장 톤 카피·**네이버 자동 선별 이미지 캐러셀**(최대 10장, 스와이프·고해상도 우선). **슈퍼관리자**에게만 `SpotVerificationStrip` + 접이식 **`SpotImageAdminDiagnostics`**(검수 상태·검색 쿼리·후보 수 요약; 후보 그리드 수동 선택 없음).
- **데이터:** 샘플 오버레이 `src/data/mock/service-sample-overlay.ts`; 타입·폴백은 `src/types/domain.ts`, `src/lib/content-post-route.ts` 참고.

## 5. 외부 연동·기능 플래그

- **Supabase:** OAuth 콜백 `src/app/auth/callback`, 클라이언트/서버 헬퍼 `src/lib/supabase/*`, `src/proxy.ts` 등. 마이그레이션은 `supabase/migrations`.
- **지도:** MapLibre GL, `NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_MAP_STYLE_URL` 등(`env.example`·코드 참고).
- **OSRM:** `OSRM_BASE_URL`, 기본 공개 라우터 폴백.
- **가디언 포스트 API:** `GUARDIAN_POSTS_API_SECRET`, `GUARDIAN_AUTHOR_USER_MAP` 등.
- **네이버 검색(하루웨이 스팟 보강):** `NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET` — [DATA_MODEL_API.md](./DATA_MODEL_API.md) §5.3. 미설정 시 목업 이미지·텍스트 폴백 유지.
- **분석:** `@vercel/analytics` 의존성 존재.

TODO: 프로덕션에서 “필수” vs “선택” 환경변수 목록을 운영 관점에서 확정할 것.

## 6. 비목표·주의 (초안)

- 법적 문구·의료/안전 권고의 최종 검수는 제품 오너·법무 검토가 필요하다. TODO: 면책·고지 문구의 승인 주체.
- README의 저장소 이름(v3)과 폴더명(v6), `package.json`의 `repository` URL(v2)은 메타 불일치 — [DEV_LOG.md](./DEV_LOG.md) 및 추후 정리 TODO.

## 7. 관련 파일

- `README.md` — 설치, 로케일 URL, 빌드, 환경 변수 안내
- `messages/` — 번역 리소스
- `env.example` — 변수 설명(실제 시크릿은 커밋하지 말 것)

---

## 8. Landing UX 기준 (확정 기준 — 구현 시 반드시 준수)

> 이 기준은 단순 디자인 가이드가 아니라 **서비스 이해도·행동 유도·제품 설득력**의 핵심이다.
> landing-page.tsx 수정 전 반드시 확인할 것.

### 8-1. 핵심 포지셔닝 (절대 기준)

| 아님 ❌ | 맞음 ✅ |
|---------|---------|
| 가디언 플랫폼 | 루트 기반 서울 하루 서비스 |
| 여행 커뮤니티 | "하루" 단위 큐레이션 |
| 관광 정보 사이트 | "그대로 따라간다"는 행동 유도 |

**UX 중심 3요소:** 하루 / 루트 / 그대로 따라간다

### 8-2. Hero — 5초 이해 원칙

- 사용자가 5초 안에 "현지인이 만든 서울 하루 루트를 따라가는 서비스"라고 이해해야 한다
- Hero에 반드시 "루트" 단어 노출
- 감성만 전달하지 말고 서비스 구조도 설명
- subline은 최대 2줄, 모바일에서 즉시 읽힘

### 8-3. Problem Section — 행동 기반 문장 원칙

- 사용자 실제 행동 기반 문장 (광고 카피 금지)
- 짧고 직접적 ("검색만 하다가 하루가 끝난 적")
- bridge 문장은 솔루션이 행동으로 연결됨을 표현

### 8-4. Route Section — "왜 이 루트인가" 명시

- route_card_diff: 루트 내용을 구체적으로 설명 (예: "카페·산책·한강을 하루에 자연스럽게 이어주는 루트")
- 추천 대상 태그 필수 (route_audience_1/2/3): "서울 처음 오는 분", "혼자 여행하는 분", "사진 좋아하는 분"
- "왜 이 루트를 따라가야 하는지" 즉시 보임

### 8-5. How It Works — 실제 행동 흐름 기준

- 추상적 표현 금지 ("하루 선택" → "루트 고르기")
- 각 스텝 outcome은 실제 사용자 행동 동사로
- "루트"를 "하루"보다 먼저 이해시키는 순서

### 8-6. Guardian Section — 루트 제작자 포지셔닝

- Guardian = 루트를 만드는 사람 (플랫폼 파트너 아님)
- headline 문구: 전문 분야 나열 금지, "이 사람의 스타일"이 보이게
- subtitle: "루트를 만든 사람을 먼저 확인하세요"

### 8-7. Pricing — 시작 장벽 감소 강조

- 가격보다 pricing_value_lead를 먼저 노출
- "혼자 찾는 것보다 훨씬 빠르게 시작할 수 있습니다"
- 복잡한 비교 설명 금지

### 8-8. Motion 원칙

| 허용 | 금지 |
|------|------|
| Hero fade-up (0.6s, ease) | Parallax |
| Card hover: -translate-y-0.5 + shadow | Bouncing |
| CTA hover: scale ≤ 1.02 | Flashy animation |
| Transition duration: 200ms | Excessive blur |

- `prefers-reduced-motion` 반드시 처리

### 8-9. 시각적 리듬 원칙

- Hero 아래 breathing space: `py-20 md:py-28`
- Problem ↔ How 사이: bg-bg-sunken 자체가 구분자
- Pricing 섹션: `py-20 md:py-28` (타 섹션보다 큰 여백)
- 목표: Apple/Airbnb 스타일 리듬감 있는 스크롤

### 8-10. Footer 원칙

- 언어/테마 컨트롤 = 카피라이트 영역 하단 (설정 패널 금지)
- 항상 세로 스택 (side-by-side 금지)
- `© {year} pentanike · Seoul` + 줄바꿈 + `[언어] [테마]`
- 존재감 낮게 (`text-white/38`, `opacity-80`)

### 8-11. QA 체크리스트 (landing-page.tsx 수정 후 확인)

- [ ] 사용자가 5초 안에 서비스 구조 이해 가능한가?
- [ ] "루트 서비스"라는 점이 명확한가?
- [ ] Guardian이 "루트를 만드는 실제 사람"처럼 느껴지는가?
- [ ] Route 카드에 "왜 좋은지" + "추천 대상"이 있는가?
- [ ] How it works가 실제 행동 기준인가?
- [ ] Motion이 조용하고 고급스러운가? (scale ≤ 1.02)
- [ ] Footer가 설정 패널처럼 보이지 않는가?
- [ ] 홈 전체가 "제품"처럼 느껴지는가?
