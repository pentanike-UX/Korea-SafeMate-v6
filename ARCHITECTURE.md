<!-- markdownlint-disable-file MD013 -->
# ARCHITECTURE — Korea SafeMate

실제 저장소 구조와 `package.json`에 선언된 기술 스택만을 기준으로 작성했다. 추정한 인프라는 명시적으로 TODO로 남겼다.

## 1. 스택 요약

| 구분 | 기술 |
|------|------|
| 런타임 | Node **20.x** (`package.json` `engines`) |
| 패키지 매니저 | **pnpm** `10.33.0` (`packageManager`) |
| 프레임워크 | **Next.js** `16.2.1` (App Router, 소스: `src/app/`) |
| UI | **React** `19.2.4`, **Tailwind CSS** `4`, **@base-ui/react**, **lucide-react**, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` |
| i18n | **next-intl** `4.8.3` — 플러그인 `next.config.ts` → `./src/i18n/request.ts` |
| 데이터·백엔드 클라이언트 | **@supabase/supabase-js**, **@supabase/ssr** |
| 지도 | **maplibre-gl** `5.x` (`next.config.ts`에서 `transpilePackages`) |
| 분석 | **@vercel/analytics** |
| 기타 CLI/도구 | **shadcn** 패키지, **tsx**, **eslint** + **eslint-config-next** |
| 언어 | **TypeScript** `5.x` |

TODO: CI에서 사용하는 정확한 Node/pnpm 버전 고정 파일(예: `.nvmrc`, GitHub Actions)이 있으면 이 표에 링크.

## 2. 디렉터리 구조 (루트)

```text
├── src/
│   ├── app/          # Next App Router (locale, public/authed, admin, api)
│   ├── components/ # UI·기능 컴포넌트
│   ├── data/       # 목·시드 데이터 등
│   ├── hooks/
│   ├── i18n/
│   ├── lib/        # 유틸, Supabase, 포스트, 지도 등 도메인 로직
│   ├── types/
│   └── proxy.ts    # Next 16+ 엣지 요청 처리(주석상 middleware 대체 명칭)
├── messages/       # next-intl 메시지
├── public/
├── scripts/        # prebuild 스캔, Supabase 시드 등
├── supabase/       # migrations
├── deploy.sh       # 배포·마이그레이션·푸시 통합 스크립트
├── env.example     # 환경 변수 설명 샘플
├── next.config.ts
├── vercel.json     # framework: nextjs
├── eslint.config.mjs
├── postcss.config.mjs
├── tsconfig.json   # paths: `@/*` → `./src/*`
└── components.json # shadcn 설정
```

**참고:** 루트에 `app/` 폴더는 없고 **`src/app/`** 만 사용한다.

## 3. `src/app` 라우팅 개요

- **`src/app/[locale]/`:** `(public)`, `(authed)` 등 그룹 라우트로 공개·로그인 후 화면 분리.
- **`src/app/admin/`:** 관리자 UI(로케일 접두와 분리된 트리).
- **`src/app/api/`:** REST형 Route Handlers(예약, 가디언, 여행자, 관리자, OSRM 등).
- **`src/app/auth/callback/`:** OAuth 콜백.

상세 트리는 `find src/app -type d` 또는 IDE에서 확인한다.

## 4. 엣지·미들웨어

- **`src/proxy.ts`:** 파일 주석에 따르면 Next.js 16+에서 **middleware 명칭이 proxy로 바뀐 동일 역할**을 한다. 별도 `middleware.ts`는 본 저장소 루트/ src에 없음(현재 브랜치 기준).

## 5. 빌드·배포

- **개발:** `pnpm dev` → `next dev`
- **프로덕션 빌드:** `pnpm build` → `next build`; **`prebuild`** 로 `node scripts/scan-post-local-images.mjs`
- **실행:** `pnpm start` → `next start`
- **Lint:** `pnpm lint` → `eslint`
- **배포 스크립트:** `pnpm deploy` 등 → `deploy.sh` (Supabase `db push`, Git 등 — 스크립트 전체는 파일 참고)
- **Vercel:** `vercel.json`은 `framework: "nextjs"` 수준만 명시.

TODO: Vercel 프로젝트 이름, 프로덕션 도메인, Preview 배포 정책은 대시보드 기준으로 보강.

## 6. 환경 변수

이름·용도는 **`env.example`** 과 소스 내 `process.env.*` 를 소스 오브 트루스로 한다. 여기서는 중복 전체 목록을 붙이지 않는다.

대표 카테고리:

- 사이트·OAuth 출처: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_OAUTH_*` 등
- Supabase: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`(서버·스크립트 전용)
- 가디언 포스트·미리보기: `GUARDIAN_*`
- 지도: `NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_MAP_STYLE_URL`
- 라우팅: `OSRM_BASE_URL`
- 기타: `SAFE_MERGE_SEED_MOCK` 등(코드 grep 결과 기준)

## 7. 메타 불일치 (정리 TODO)

- 원격 저장소: **Korea-SafeMate-v6** (`git@github.com:pentanike-UX/Korea-SafeMate-v6.git`).
- `package.json`의 `repository` / `bugs` / `homepage` 는 **Korea-SafeMate-v2** URL을 가리킨다.
- README 제목은 “**v3**”로 표기.

운영·온보딩 문서에서 어느 URL을 canonical로 할지 결정이 필요하다.
