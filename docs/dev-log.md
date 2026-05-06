<!-- markdownlint-disable-file MD013 MD024 -->
# 개발 작업 로그 (Dev Log)

작업 완료 후 **반드시** 이 파일에 기록한다. (루트 `DEV_LOG.md`는 과거 맥락 보존용이며, **신규 기록은 본 파일을 우선**한다.)

- 비밀·토큰·환경변수 **값**은 적지 않는다.
- 검증하지 않은 항목은 **미검증**으로 명시한다.
- 실제로 바꾼 내용만 쓴다.

---

## 2026-05-07 - AI 협업 규칙 문서 및 가드 문서 연동

### 목표

- AI/인간 공통 작업 절차·UX·검증·보고 원칙을 단일 문서로 두고, 기존 가드 문서와 상호 참조를 고정한다.

### 변경 파일

- `AI_DEVELOPMENT_RULES.md`
- `AGENTS.md`
- `FOUNDATION.md`
- `HARNESS.md`

### 변경 내용

- `AI_DEVELOPMENT_RULES.md` 신설: Plan/Check, UX·개발 원칙, `pnpm` 기준 검증, 완료 보고 10항목, 관련 가드 문서 개정 시 교차 검토 표.
- `AGENTS.md`: 목차에 본 문서 추가, 에이전트 요약에 협업 문서 우선순위 문구.
- `HARNESS.md`: 서두에 본 문서 링크 및 가드 문서 개정 시 정합성 확인 의무, §6 보고 형식과 연결, §8 관련 문서 목록 추가.
- `FOUNDATION.md`: 협업 절차·보고는 `AI_DEVELOPMENT_RULES.md` 참조(제품 우선순위 불변).

### 검증 결과

- 미검증 (문서-only 변경; 이 커밋 시점에 `pnpm lint` / `pnpm build` 실행 여부 미확인).

### 남은 이슈

- 없음.

### 다음 작업

- 기능 코드 변경 시 [HARNESS.md](../HARNESS.md) §5 검증 파이프라인 적용.

---

## 2026-04-30 - 현장 메모 카드 통합 및 Places 사진 로딩 보강

### 목표

- 하루웨이 상단을 단일 「현장 메모」 카드 UX로 정리하고, Google Places 사진 resolve·갤러리 표시 실패를 줄인다.

### 변경 파일

- `messages/en.json`, `messages/ja.json`, `messages/ko.json`, `messages/th.json`, `messages/vi.json`
- `src/app/api/google/places/details/route.ts`
- `src/components/route-posts/route-day-preview.tsx`
- `src/hooks/use-google-place-photos.ts`
- `src/lib/google-places-server.ts`
- `src/lib/spot-image-gallery.ts`

### 변경 내용

- `route-day-preview`: 단일 카드 레이아웃, 지표 한 줄, 4개 메모 블록, 노이즈 문구 필터, i18n 키(`fieldMemo*` 등).
- `google-places-server`: Photo `getMedia` 호출에 헤더 인증·302 Location 폴백·오류 로깅·쿼리 `key` 재시도.
- `spot-image-gallery`: Google Places 슬라이드에 원본 URL 후 `/api/image-proxy` 폴백.
- `details` API: 응답에 `photoFallbackReason` 추가.
- `use-google-place-photos`: 상세 응답의 `photoFallbackReason`을 클라이언트 로그에 포함.

### 검증 결과

- 미검증 (본 기록 작성 시 해당 커밋에서의 로컬 `pnpm lint` / `pnpm build` 재실행 없음).

### 남은 이슈

- 큐레이션 갤러리가 10장을 채우면 Google 슬롯이 밀릴 수 있음(설계상 우선순위).

### 다음 작업

- 필요 시 Places 실패 시 서버 로그(`[google-places]`)와 브라우저 콘솔의 `photoFallbackReason` 대조.

---

## 2026-04-30 - 로컬 플레이북 메모 톤·브리핑 카드·단일 article 상단

### 목표

- 「로컬 플레이북 메모」 영역을 카드 나열이 아닌 읽기 흐름 위주로 조정하고, 톤을 현장 메모에 가깝게 맞춘다.

### 변경 파일

- `messages/ko.json` — 및 동 로케일 다수 (`en.json`, `ja.json`, `th.json`, `vi.json` 일부 커밋)
- `src/components/route-posts/route-day-preview.tsx`
- `src/components/route-posts/route-post-detail-client.tsx`

### 변경 내용

- 상단을 단일 플레이북 article 흐름으로 재구성(`route-post-detail-client`, 커밋 `557ef1e` 등).
- `route-day-preview`: compact 브리핑 카드 → 현장 메모 톤 문구·타이틀 조정(커밋 `34cc5ad`, `96d94f3`).

### 검증 결과

- 미검증.

### 남은 이슈

- 없음.

### 다음 작업

- 상단 카드 문구는 실제 포스트 구조화 본문(`routeSummary` 등)과 함께 콘텐츠 편집 시 재확인.

---

## 2026-04-30 - 슈퍼관리자 Google Places 검수 링크 및 Place ID 저장

### 목표

- 스팟별 Google Maps 링크·디버그 정보를 슈퍼관리자에게만 노출하고, Text Search로 찾은 Place를 DB에 저장할 수 있게 한다.

### 변경 파일

- `messages/en.json`, `messages/ja.json`, `messages/ko.json`, `messages/th.json`, `messages/vi.json`
- `src/app/api/admin/content-posts/[postId]/google-place-bind/route.ts`
- `src/components/route-posts/google-places-spot-inspect.tsx`
- `src/components/route-posts/route-post-detail-client.tsx`
- `src/lib/google-maps-spot-link.ts`

### 변경 내용

- Maps 링크 빌더(`google-maps-spot-link`), 검수 행·디버그 블록 UI, `route-post-detail-client`에서 슈퍼관리자 전용 렌더.
- `POST .../google-place-bind`: 스팟의 `google.placeId` 및 메타 저장(서버에서 Text Search·Details 연계).

### 검증 결과

- 미검증.

### 남은 이슈

- 일반 사용자에게 검수 UI가 노출되지 않도록 유지(쿠키·역할 확인 로직 변경 시 회귀 테스트 필요).

### 다음 작업

- 프로덕션에서 Place API 할당량·키 제한 모니터링.

---

## 2026-04-30 - Google place_id 기반 스팟 갤러리 및 Places API 라우트

### 목표

- 스팟에 `place_id`가 있을 때 Google Places 사진을 갤러리에 포함하고, 서버 전용 API 라우트로 키를 노출하지 않는다.

### 변경 파일

- `README.md`, `env.example`
- `src/app/api/google/places/details/route.ts`, `photo/route.ts`, `search/route.ts`
- `src/hooks/use-google-place-photos.ts`, `use-spot-gallery.ts`
- `src/lib/content-post-route.ts`, `google-place-query.ts`, `google-places-server.ts`, `spot-image-gallery.ts`
- `src/types/domain.ts`

### 변경 내용

- Places (New) Text Search / Details / Photo media 연동, 클라이언트 훅에서 검색→상세→photo URI 흐름.
- 갤러리 빌더에서 Google URL 우선순위 및 `spot.google` 타입 확장.

### 검증 결과

- 미검증.

### 남은 이슈

- `GOOGLE_MAPS_API_KEY` 미설정 시 사진 없음(503/빈 배열).

### 다음 작업

- 운영 환경 변수·GCP Places API 활성화 확인.

---

## 2026-04-30 - 접힌 플레이북은 텍스트만, 펼침에서만 원격 이미지

### 목표

- 무료(접힘) 상태에서는 네이버/Google 이미지 호출을 줄이고, 유료 펼침에서만 갤러리 파이프라인을 돌린다.

### 변경 파일

- `src/components/route-posts/route-post-detail-client.tsx`
- `src/hooks/use-spot-gallery.ts`

### 변경 내용

- `fetchRemote`(또는 동등 플래그)에 따라 `useSpotGallery`·원격 이미지 fetch 게이트.

### 검증 결과

- 미검증.

### 남은 이슈

- 없음.

### 다음 작업

- UX 카피와 잠금 해제 플로우 문서 정합([HARNESS.md](../HARNESS.md) UI 연결 원칙).

---

> **참고:** 동일 날짜의 네이버·탐색 카드·실데이터 보강 등은 루트 [DEV_LOG.md](../DEV_LOG.md) **2026-04-30** 절에 요약되어 있다. 위 항목은 커밋 기준으로 문서화가 비어 있던 **Places·상단 메모·관리자 검수·갤러리 게이트** 축을 보완한 것이다.
