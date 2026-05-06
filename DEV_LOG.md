<!-- markdownlint-disable-file MD013 -->
# DEV_LOG — 개발 로그

> **신규 작업 기록:** 형식·필수 여부는 **[docs/dev-log.md](./docs/dev-log.md)** 를 따른다. 본 파일은 장문 맥락·역사 보존용으로 유지한다.

날짜별로 작업 맥락·결정·후속 TODO를 남긴다. 최신 항목이 위에 오도록 추가한다.

---

## 2026-04-30 — 하루웨이 실장소 보강·네이버 프록시·탐색 UX·스팟 이미지 자동 갤러리

- **목적:** 기존 목업 하루웨이를 삭제하지 않고 `real_place_name`, 주소·좌표, `images.hero`, `source_status`, `leg_from_previous` 등으로 품질 보강. 네이버 Local/Image Search는 **Route Handler에서만** 호출(`NAVER_SEARCH_CLIENT_ID` / `NAVER_SEARCH_CLIENT_SECRET` — 시크릿은 서버 전용). 스팟 이미지는 **슈퍼관리자 후보 선택 UI 없이** 네이버 결과를 품질 점수·필터 후 자동 적용, 상세는 **최대 10장 캐러셀**, 목록 카드는 **`getRouteExploreCardCoverUrl`** 파이프라인. 쿼리별 **24h 로컬 캐시**(`naver:image:*`), **`/api/image-proxy`**로 hotlink 완화.
- **코드:** `src/types/domain.ts` (`RouteSpot`·`NaverImageCandidate`·`images.gallery`), `src/data/mock/service-sample-overlay.ts`, `src/data/mock/mock-real-place-assets.ts`, `src/app/api/naver/local-search`, `src/app/api/naver/image-search`, `src/app/api/image-proxy`, `src/lib/content-post-route.ts` (`getSpotImageDisplayUrl`, `firstUrlFromNaverCandidates`), `src/lib/spot-image-gallery.ts`, `src/lib/naver-image-quality.ts`, `src/lib/naver-image-query-cache.ts`, `src/lib/naver-image-api-mapper.ts`, `src/hooks/use-spot-gallery.ts`, `src/hooks/use-route-representative-cover-image.ts`, `src/components/route-posts/spot-image-carousel.tsx`, `spot-image-admin-diagnostics.tsx`, `src/lib/route-post-card-meta.ts`, `next.config.ts`(`remotePatterns`). **제거:** `use-spot-display-image.ts`, `spot-image-candidates.tsx`.
- **UI:** `/explore/routes` 카드(`ExploreRouteCard`/`RoutePostCard`·`useRouteRepresentativeCoverImage`), `RouteDayPreview`, 상세 **`SpotImageCarousel`**·슈퍼관리자 `SpotVerificationStrip` + **`SpotImageAdminDiagnostics`**(접이식 요약).
- **문서:** `DATA_MODEL_API.md`(§5.3 이미지 순서·갤러리), `ARCHITECTURE.md`, `PRODUCT_SPEC.md`, `HARNESS.md`, `IA_SCREEN_INVENTORY.md`, `env.example`.
- **후속:** 관리자 스팟 검수 선택값의 Supabase 영속화, `pnpm lint` 저장소 전체 경고·에러 정리.

## 2026-04-24 — Data Model & API (4단) 추가

- **파일:** `DATA_MODEL_API.md` — 엔티티, 테이블·RLS·인덱스, 마이그레이션 트리, Zod, `src/app/api` 구조, Edge·시드·환경 변수, §11 절차.
- **연동:** `FOUNDATION.md`·`IA_SCREEN_INVENTORY.md` 링크, `AGENTS.md`·`HARNESS.md`·Foundation Changelog.
- **저장소 메모:** 기존 `202602*`/`202603*` 마이그레이션보다 늦은 타임스탬프, `src/lib/validation`, PostGIS/`ll_to_earth`, `crr_update_guardian_limited`의 `old.status` 구현 검증, `env.example`.

## 2026-04-24 — Screen Specs 3A (마케팅+Auth) 추가

- **파일:** `SCREEN_SPECS_3A.md` — M01, M02, M04, M05, A01, A02, A04 상세 스펙, 공통 UI 전제, 구현 주의, 완료 리포트 템플릿.
- **연동:** 전제 링크를 `FOUNDATION.md`·`IA_SCREEN_INVENTORY.md`로 통일. `AGENTS.md`·`HARNESS.md` 목차/서두에 링크·착수 조건(IA §13) 명시.
- **저장소 메모:** `src/components/ui/`, mock 경로, `[locale]` 라우팅, A04 `localStorage` vs Foundation §3.2 TODO.

## 2026-04-24 — IA & Screen Inventory (2단) 추가

- **파일:** `IA_SCREEN_INVENTORY.md` — 역할 모델, 여정, 목표 라우팅 트리, 화면 ID 표, 릴리즈 매트릭스(M/P/L), §13 절차.
- **연동:** `FOUNDATION.md` 링크로 통일(`ksm_01_foundation.md` 제거). `AGENTS.md`·`HARNESS.md`·`PRODUCT_SPEC.md`에 링크·적용 조건(§0) 반영.
- **저장소 메모:** `src/app/`, `src/data/mock/`, i18n `ja` vs IA `th`/`vi` 갭을 문서 상단·§13에 명시.

## 2026-04-24 — Foundation 문서 추가 (v6 리팩토링 기준)

- **작업:** 사용자 제공 **KSM v6 Foundation** 전문을 `FOUNDATION.md`로 저장. 이 저장소 실경로(`src/app/`, `env.example`, i18n `en`/`ko`/`ja`)와의 정합을 문서 내 **저장소 메모**·§0.2·§3.3·§9 Changelog에 반영.
- **연동:** `AGENTS.md` 목차·원칙에 Foundation 링크 및 우선순위 명시. `HARNESS.md` 서두·§8에 Foundation 최우선 문구 추가.
- **코드:** 앱 소스 미변경.
- **후속:** Foundation §10.1–10.3(이해 질문·스캔 갭 리포트·RLS 1단계 계획)은 별도 작업으로 수행.

## 2026-04-24 — Harness 문서 초기 세팅

- **브랜치:** `main` (원격 `origin/main`과 동기 상태였음 — 작업 시점 기준 `git status -sb`로 재확인할 것).
- **원격:** `git@github.com:pentanike-UX/Korea-SafeMate-v6.git`.
- **작업:** AI 협업용 Harness 기준 문서 추가.
  - 신규: `HARNESS.md`, `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `DEV_LOG.md`.
  - 갱신: `AGENTS.md` — 한국어 목차·운영 원칙 요약 추가, 기존 Git/Next.js/Vercel 에이전트 블록 유지.
- **코드:** 애플리케이션 소스(`.ts`/`.tsx` 등)는 변경하지 않음.
- **검증:** `pnpm lint` / `pnpm build`는 문서-only 변경이므로 이번 커밋 범위에서는 생략 가능 — 이후 코드 변경 시 [HARNESS.md](./HARNESS.md) §5 필수.
- **후속 TODO:** `package.json`의 `repository` 필드와 README 제목(v3)·리포지토리 폴더명(v6) 정합성 검토; `pnpm check` 스크립트 도입 여부.
