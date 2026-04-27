<!-- markdownlint-disable-file MD013 MD025 MD034 -->
# AGENTS — Korea SafeMate

**작업 범위:** 연결된 Git 원격(`origin`)과 **현재 체크아웃된 브랜치**만을 기준으로 한다. 저장소 루트는 워크스페이스에 열린 경로이며, 로컬 디렉터리를 임의로 옮기거나 경로를 추정하지 않는다.

## 문서 목차

| 문서 | 목적 |
|------|------|
| [FOUNDATION.md](./FOUNDATION.md) | v6 리팩토링·제품·스택·데이터 원칙 (**개별 프롬프트와 충돌 시 우선**) |
| [IA_SCREEN_INVENTORY.md](./IA_SCREEN_INVENTORY.md) | 2단 — IA·화면 인벤토리·릴리즈 매트릭스 (Foundation §10 이후 적용) |
| [SCREEN_SPECS_3A.md](./SCREEN_SPECS_3A.md) | 3A — 마케팅+인증 화면 스펙 (IA §13 승인 후 구현) |
| [DATA_MODEL_API.md](./DATA_MODEL_API.md) | 4단 — DB·RLS·Zod·API·Edge (Foundation §10·기존 스키마 대조 후) |
| [HARNESS.md](./HARNESS.md) | AI 협업 작업 운영 기준, 검증, 도구별 역할 |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) | 제품·화면·기능 초안 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 디렉터리 구조, 스택, 배포·환경 개요 |
| [DEV_LOG.md](./DEV_LOG.md) | 날짜별 작업·결정 로그 |
| [README.md](./README.md) | Node 버전, 설치, 실행, 빌드 |

## 에이전트 공통 원칙 (요약)

- 변경 전 **관련 소스·설정·문서**를 읽는다.
- **기능 추가 / 버그 수정 / 리팩터링**을 구분해 범위와 검증을 맞춘다.
- **UI ↔ 데이터·API·라우트·i18n** 연결 누락을 금지한다.
- **가짜 구현**(미연결 버튼, 빈 핸들러, 데모만 있는 프로덕션 경로 등)과 **시크릿·환경변수 하드코딩**을 금지한다.
- 검증: `pnpm lint`, `pnpm build`, 로컬 `pnpm dev`로 화면 확인(프리뷰). 상세는 HARNESS.md.
- 불확실한 사항은 코드에 억지로 넣지 말고 **TODO**로 남기거나 질문한다.
- v6 리팩토링·제품 방향은 **[FOUNDATION.md](./FOUNDATION.md)** 를 따른다. HARNESS·개별 지시와 충돌하면 Foundation이 우선한다.

---

<!-- BEGIN:git-agent-rules -->
Git: 사용자가 `main`에 푸시하라고 하면 별도 확인 질문 없이 `git push origin main`(또는 요청한 원격/브랜치)을 바로 실행한다. 커밋 메시지가 정해져 있으면 동일하게 적용한다.
<!-- END:git-agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
