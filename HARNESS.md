<!-- markdownlint-disable-file MD013 -->
# HARNESS — AI 협업 작업 운영 기준

Korea SafeMate 저장소에서 사람·AI가 동일한 기준으로 개발하기 위한 운영 문서다.

- **최우선:** [FOUNDATION.md](./FOUNDATION.md) — v6 리팩토링·제품 정체성·마이그레이션·스택 목표·데이터·프로세스. 개별 작업 프롬프트와 충돌 시 **Foundation이 우선**한다.
- **IA·화면 지도:** [IA_SCREEN_INVENTORY.md](./IA_SCREEN_INVENTORY.md) — 역할·라우트·인벤토리·릴리즈 매트릭스. Foundation §10 완료 전에는 구현에 적용하지 않는다(IA §0).
- **화면 스펙(3A):** [SCREEN_SPECS_3A.md](./SCREEN_SPECS_3A.md) — 마케팅·인증 7화면. **IA §13 갭 리포트·계획서 승인 전 구현 착수 금지**(3A 상단 전제).
- **데이터·API(4단):** [DATA_MODEL_API.md](./DATA_MODEL_API.md) — 스키마·RLS·Zod·Route Handlers. **기존 `supabase/migrations`와 충돌 검토·DROP 금지** 후 적용.
- 구현 세부·디렉터리 스냅샷: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 제품 초안(레포 기준): [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)

## 1. 작업 전제

- **원격·브랜치:** `git remote -v`, `git branch --show-current`로 확인한 **현재 연결된 `origin`과 체크아웃 브랜치**에서만 작업한다. 다른 클론 경로나 브랜치를 가정하지 않는다.
- **컨텍스트 수집:** 코드를 바기 전에 README, `package.json`, 이 문서들, 변경 대상 파일과 그 **호출 관계(라우트·API·컴포넌트·메시지 키)**를 읽는다.
- **모름:** 사실이나 스택을 추측해 문서·코드에 박지 않는다. 필요하면 `TODO` 또는 이슈/질문으로 남긴다.

## 2. 작업 유형 분리

| 유형 | 범위 예시 | 검증 초점 |
|------|-----------|-----------|
| **기능 추가** | 새 라우트, API, UI 플로우 | 새 경로·권한·i18n·환경변수·에러 처리까지 end-to-end |
| **버그 수정** | 회귀 방지, 최소 변경 | 재현 경로, 관련 테스트·수동 시나리오 |
| **리팩터링** | 구조·이름·중복 제거 | 동작 동일, `build`/`lint` 통과, 공개 API 변경 시 호출부 전부 |

한 PR·한 작업 단위에서 위 유형을 섞지 않는 것을 권장한다.

## 3. UI와 기능 연결

- 새 버튼·폼·토글은 **실제 핸들러·서버 액션·Route Handler·데이터 소스**와 연결된 뒤에만 “완료”로 본다.
- **가짜 구현 금지:** `console.log`만 있는 제출, 항상 성공하는 가짜 API, 프로덕션에서 도달 가능한 빈 목 데이터 UI만 두는 것 등.
- **i18n:** 사용자 노출 문자열은 `messages/` 및 `next-intl` 사용 패턴을 따른다. TODO: 팀에서 정한 예외(브랜드 고유명 등)가 있으면 문서화.

## 4. 환경 변수·비밀

- **하드코딩 금지:** API 키, Supabase 서비스 롤, OAuth 시크릿 등을 소스에 넣지 않는다.
- 실제 키는 Vercel·로컬 `.env.local` 등 **비저장소** 채널만 사용한다. 변수 이름·의미는 코드의 `process.env.*`와 루트 `env.example`을 기준으로 한다.
- `NEXT_PUBLIC_*`는 브라우저에 노출된다는 전제로만 사용한다.
- **네이버 검색:** `NAVER_SEARCH_CLIENT_ID` / `NAVER_SEARCH_CLIENT_SECRET`는 **서버(Route Handler)에서만** 사용한다. Local/Image Search는 `src/app/api/naver/*`를 통해서만 호출한다. 시크릿에 `NEXT_PUBLIC_` 접두사를 붙이지 않는다([DATA_MODEL_API.md](./DATA_MODEL_API.md) §5.3, §10).

## 5. 검증 파이프라인

`package.json` 기준(패키지 매니저: **pnpm** `10.33.0`):

| 단계 | 명령 | 비고 |
|------|------|------|
| Lint | `pnpm lint` | ESLint(`eslint.config.mjs`) |
| Build | `pnpm build` | `prebuild`에서 `scripts/scan-post-local-images.mjs` 실행 |
| 로컬 프리뷰 | `pnpm dev` | 기본 `http://localhost:3000` — README 및 라우팅 참고 |
| **check** | *(스크립트 없음)* | TODO: 팀에서 `lint`+타입체크 등을 묶은 `pnpm check` 도입 여부 결정 |

배포는 `deploy.sh` 및 Supabase CLI 연동 등 별도 절차가 있다. 로컬에서 전체 배포 파이프를 재현할 수 없으면 문서에 한계를 적고, 가능한 하위 집합만 검증한다.

## 6. 작업 결과 보고 형식

에이전트·인간 모두 PR·채팅 마무리 시 아래를 맞춘다.

1. **요약:** 무엇을 왜 바꿨는지 한두 문단.
2. **변경 파일:** 경로 목록(문서만 / 코드만 구분 가능하면 표시).
3. **작업 유형:** 기능 추가 | 버그 수정 | 리팩터링.
4. **검증:** 실행한 명령과 결과(성공/실패, 실패 시 로그 요약).
5. **UI 연결:** 영향 받는 URL·로케일·역할(여행자/가디언/관리자)이 있으면 명시.
6. **TODO·리스크:** 미완료, 배포/환경 의존, 회귀 가능성.

## 7. 도구별 역할 구분

### Cursor

- IDE와 동일한 워크스페이스에서 **파일 편집, 검색, 터미널, Git 상태 확인**을 수행하는 에이전트에 적합하다.
- 이 저장소의 **HARNESS / AGENTS / 아키텍처**를 그대로 적용해 구현·검증 루프를 돌린다.

### Claude Code

- 터미널·CLI 중심 워크플로, 배포 스크립트와 연계된 커밋 메시지(`DEPLOY_MESSAGE.txt` 등) 패턴이 코드베이스에 존재할 수 있다.
- **역할:** Cursor와 동일한 금지·검증 원칙을 따르되, 브랜치·원격은 항상 로컬 Git 상태로 확인한다. Claude Code 전용 예외 규칙이 생기면 이 문서에 한 줄 추가한다. TODO: 팀 내 Claude Code 전용 체크리스트가 있으면 링크 또는 섹션 추가.

### ChatGPT

- **코드 대신** 기획 초안, 정보 구조, UX 카피 방향, 시스템·에이전트용 **프롬프트 초안**, PR·스펙 **리뷰 기준**(체크리스트, 누락 질문)에 두는 것을 권장한다.
- 저장소에 직접 쓰지 않을 때는 “제안”과 “반영됨”을 구분해 [DEV_LOG.md](./DEV_LOG.md)나 PR에 남긴다.

## 8. 관련 문서

- [FOUNDATION.md](./FOUNDATION.md) — v6 Foundation (Claude Code 주입·리팩토링 원칙)
- [IA_SCREEN_INVENTORY.md](./IA_SCREEN_INVENTORY.md) — IA·화면 인벤토리 (2단)
- [SCREEN_SPECS_3A.md](./SCREEN_SPECS_3A.md) — 화면 스펙 3A (마케팅+Auth)
- [DATA_MODEL_API.md](./DATA_MODEL_API.md) — 데이터 모델 & API (4단)
- [AGENTS.md](./AGENTS.md) — 목차·한 줄 원칙·Git/Next/Vercel 에이전트 블록
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 구조·스택
- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) — 기능·화면 초안
