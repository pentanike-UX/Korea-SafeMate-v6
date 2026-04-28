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
| API | `src/app/api/**` | 예약, 가디언 프로필/포스트, 여행자 저장·매치, OSRM, 개발용 mock 로그인 등 |

TODO: 각 플로우의 “해피 패스”와 “외부 서비스 미설정 시” 동작(목 데이터 여부, 에러 UI)을 정리할 것.

## 5. 외부 연동·기능 플래그

- **Supabase:** OAuth 콜백 `src/app/auth/callback`, 클라이언트/서버 헬퍼 `src/lib/supabase/*`, `src/proxy.ts` 등. 마이그레이션은 `supabase/migrations`.
- **지도:** MapLibre GL, `NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_MAP_STYLE_URL` 등(`env.example`·코드 참고).
- **OSRM:** `OSRM_BASE_URL`, 기본 공개 라우터 폴백.
- **가디언 포스트 API:** `GUARDIAN_POSTS_API_SECRET`, `GUARDIAN_AUTHOR_USER_MAP` 등.
- **분석:** `@vercel/analytics` 의존성 존재.

TODO: 프로덕션에서 “필수” vs “선택” 환경변수 목록을 운영 관점에서 확정할 것.

## 6. 비목표·주의 (초안)

- 법적 문구·의료/안전 권고의 최종 검수는 제품 오너·법무 검토가 필요하다. TODO: 면책·고지 문구의 승인 주체.
- README의 저장소 이름(v3)과 폴더명(v6), `package.json`의 `repository` URL(v2)은 메타 불일치 — [DEV_LOG.md](./DEV_LOG.md) 및 추후 정리 TODO.

## 7. 관련 파일

- `README.md` — 설치, 로케일 URL, 빌드, 환경 변수 안내
- `messages/` — 번역 리소스
- `env.example` — 변수 설명(실제 시크릿은 커밋하지 말 것)
