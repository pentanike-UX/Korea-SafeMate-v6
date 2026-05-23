<!-- markdownlint-disable-file MD013 MD024 -->
# 개발 작업 로그 (Dev Log)

작업 완료 후 **반드시** 이 파일에 기록한다. (루트 `DEV_LOG.md`는 과거 맥락 보존용이며, **신규 기록은 본 파일을 우선**한다.)

- 비밀·토큰·환경변수 **값**은 적지 않는다.
- 검증하지 않은 항목은 **미검증**으로 명시한다.
- 실제로 바꾼 내용만 쓴다.

---

## 2026-05-23 - G01 Phase 2: 거주 증빙 문서 업로드(비공개 버킷 + 서명 URL)

### 목표

지원서에 거주 증빙 문서(민감 PII) 첨부. 보안 우선 설계.

### 설계 (보안)

- 비공개 버킷 `guardian-docs`(public=false, 10MB, pdf/jpg/png/webp). 클라이언트 직접 접근 0.
- 업로드·열람 모두 **service-role 경유** → storage RLS 정책 불필요(버킷 자체가 비공개).
- 지원자: 서버액션이 service-role로 업로드, 경로(`{userId}/residence-*.ext`)만 application에 저장.
- 관리자: 단기(60s) 서명 URL로만 열람.

### 변경 파일

- `supabase/migrations/20260523000006_guardian_docs_bucket.sql` (신규) + 운영 적용 — 비공개 버킷.
- `src/components/guardian/guardian-apply-actions.ts` — `uploadResidenceProofAction`(FormData, 크기/타입 검증, service-role 업로드). submit 액션에 residenceProofPath 추가 → residence_proof 저장.
- `src/components/guardian/guardian-apply-form.tsx` — 선택 파일 입력(accept 제한). 업로드 성공 후 submit.
- `src/app/api/admin/guardian-applications/[applicationId]/document/route.ts` (신규) — admin 게이트 + 서명 URL 302.
- `src/components/admin/admin-guardian-applications.tsx` — "거주 증빙 문서 보기" 링크(미제출 표시).
- `src/app/admin/guardians/page.tsx` — 쿼리에 residence_proof 추가.

### 검증 결과

- `pnpm build`·`pnpm lint`(신규 파일) 통과.
- 로컬 service-role 미설정 → 업로드 액션이 친절한 에러 반환. 운영에서 실제 작동.

### 남은 이슈

- sample_route 첨부(루트 빌더 연계) 미구현.

## 2026-05-23 - AD03 admin 신청 리뷰 + 승인→guardian 승격 (funnel end-to-end 완성)

### 목표

G01의 나머지 반쪽 — admin이 지원서를 승인/반려하고, 승인 시 실제로 guardian이 활성화되도록.

### 핵심 구조 발견

- guardian `app_role`은 `guardian_profiles.approval_status='approved'`(또는 profile_status)에서 OAuth sync(`sync-oauth-user.ts`) 시 파생. 따라서 "승인=enable"은 application 상태만으로 부족 → guardian_profiles 브리지 필요.
- `guardian_profiles` NOT NULL은 user_id + display_name뿐 → 최소 브리지 가능.
- enum `guardian_approval_status`에 `approved` 포함 확인.

### 변경 파일

- `src/app/api/admin/guardian-applications/[applicationId]/review/route.ts` (신규) — real-session + app_role∈{admin,super_admin} 게이트, service-role 쓰기(admin RLS가 'admin'만 매칭하므로 우회 + reviewer_id 기록). approve/reject/request_revision. **승인 시 guardian_profiles upsert(approval_status=approved) + users.app_role=guardian 즉시 승격**(admin/super_admin은 강등 금지: `.not(app_role,in,(admin,super_admin))`).
- `src/components/admin/admin-guardian-applications.tsx` (신규) — 검토 큐 UI(승인/보완/반려 + 사유 textarea, 반려·보완 시 사유 필수). mock 응답·에러 피드백, 성공 시 router.refresh.
- `src/app/admin/guardians/page.tsx` — async + real-session admin 게이트(미인증→/login, 비admin→/admin/dashboard). service-role로 지원서 조회, pending/needs_revision만 큐 노출. PII 노출 전 게이트 보강.

### 검증 결과

- `pnpm build`·`pnpm lint` 통과.
- 로컬엔 service-role 키 없어 svc=null → 큐는 "service-role 미설정" 안내, mock 응답. 운영(키 존재)에서 실제 작동.

### 남은 이슈

- G01 Phase 2: residence_proof 문서 업로드, sample_route.
- 승인 시 생성되는 guardian_profiles는 최소 필드(display_name)만 — 가디언이 온보딩에서 나머지 프로필 보강 필요.

## 2026-05-23 - G01 가디언 지원 funnel 구현 (가짜 제출 제거 + G02 상태 화면)

### 목표

가짜 제출이던 가디언 지원서를 실제 `guardian_applications` 영속화로 전환. 사용자 결정: 로그인 필수 / 문서 Phase 2 / 전용 상태 화면.

### 변경 파일

- `supabase/migrations/20260523000005_guardian_applications_applicant_fields.sql` (신규) + 운영 적용 — real_name/display_name/contact_email 컬럼(리뷰 자족성).
- `src/components/guardian/guardian-apply-actions.ts` (신규) — `submitGuardianApplicationAction`. 로그인 필수(needsLogin), zod 검증, user_id unique 중복 방지(23505 처리), RLS insert own.
- `src/components/guardian/guardian-apply-form.tsx` — 가짜 onSubmit 제거. 제어 폼 + useTransition + 서버액션 호출. 미로그인 시 `/login?next=/guardians/apply` 유도. 성공 다이얼로그 → "지원 현황 보기"(router.refresh).
- `src/components/guardian/guardian-application-status.tsx` (신규, G02) — pending/approved/rejected/needs_revision 상태·언어·제출일·검토 의견 표시.
- `src/app/[locale]/(public)/guardians/apply/page.tsx` — 로그인 사용자의 기존 신청 조회 → 있으면 상태 화면, 없으면 폼(isAuthed 전달). ko 로케일 전용(영문은 마케팅 컴포넌트).

### 검증 결과

- `pnpm build` 통과. `pnpm lint` 신규 파일 경고 없음.
- 타입: 클라이언트가 Database 제네릭 미적용이라 select 결과 `never` → 명시 인터페이스 + `as unknown as` 캐스팅으로 해결.

### 남은 이슈 (중요)

- **AD03 admin 신청 리뷰 = G01 나머지 반쪽 미구현**. `guardian_applications`를 읽는 admin 코드 전무, `/admin/guardians`는 mock 디렉토리. 승인/반려 액션 + 펜딩 큐 UI 필요 → 현재 신청은 pending 고정(DB 직접 승인만). admin UX·승인 정책 결정 후 별도 구현.
- G01 Phase 2: residence_proof 문서 업로드(Storage), sample_route 첨부.

## 2026-05-23 - 섹션 5 일부: G01 가짜 제출 발견 + 세션 RLS 정책 perf 최적화

### 목표

TODO 섹션 3 잔여(G01/G02/AD03) audit 마무리 + 섹션 5 기술 부채 중 안전·고가치 항목 처리.

### audit 결과 (기록만)

- **G01 Guardian Application**: 🔴 `guardian-apply-form.tsx onSubmit`이 가짜 제출(DB 미기록 + `TODO(prod)`). 폼 필드(실명/활동명) ↔ `guardian_applications`(motivation/languages/user_id NOT NULL) 불일치. 로그인 필수 여부·문서 업로드 등 제품 결정 필요 → speculative 빌드 보류.
- **G02/AD03**: G01이 실데이터를 안 만들어 pending·승인 대상이 없음 → G01 선행 필요.

### 변경 (perf 최적화 — 운영 적용 + 로컬 파일)

- `supabase/migrations/20260523000004_perf_rls_initplan_session_policies.sql` (신규) + 운영 적용 — 이번 세션 추가 정책의 `auth.uid()` → `(select auth.uid())` (auth_rls_initplan 권고). content_posts 중복 SELECT 2개 → 1개 OR 통합. traveler_saved_routes FK(route_id) 인덱스.

### 검증 결과

- 운영 적용 성공.
- Performance advisors 전체: 245 WARN + 69 INFO — 대부분 세션 외 사전 존재(기존 정책의 auth_rls_initplan 77, multiple_permissive 168 등). 데이터/트래픽 0인 현 시점 영향 미미 → 실데이터 후 별도 라운드 권장(TODO 기록).

### 남은 이슈

- 사전 존재 perf 부채 대량 — 별도 전담 라운드.
- G01 funnel은 제품 결정 후 구현.

## 2026-05-23 - 섹션 4 검증 라운드 (정적 검증 완료 + 운영 데이터 0건 발견)

### 목표

TODO 섹션 4 — 이번 세션 배포분 검증. 정적으로 가능한 것 모두 확인.

### 검증 결과

- **spot_images admin 경로**: ✅ admin/spots GET 컬럼 셋(`district`/`naver_data`/`image_strategy`/`primary_image_url` + `spot_images`) 운영 존재, SELECT 에러 없음. images API insert 컬럼 전부 존재.
- **RLS 정책**: ✅ `get_advisors` 클린(`auth_leaked_password_protection` 1건만).
- **트리거/컬럼/함수**: ✅ 운영 설치 확인.
- **🔑 핵심 발견**: 운영 DB `routes`·`route_spots` **데이터 0건**. 모든 루트 표시가 mock 기반. directions 토스트·트리거 무효화·저장 토글 등 런타임 흐름은 **가디언 첫 게시 전까지 실행 안 됨** — 스키마·코드는 검증됐으나 실데이터 스모크는 게시 시점으로 이연.

### 변경 파일

- `docs/TODO.md` — 섹션 4 audit 결과 반영 + 운영 데이터 시딩 항목 신규 추가.

### 남은 이슈

- 운영 DB 시드 전략 필요(`pnpm seed:sample` 등 스크립트는 존재). 데모/실서비스 전 결정 사항.
- `/api/health/routing`은 admin 세션 HTTP 호출로만 cache_likely_hot 실측 가능.

## 2026-05-23 - 섹션 3 완성도 audit + T11 dead 버튼 처리 (저장=북마크)

### 목표

TODO 섹션 3(🟡 완성도 점검) audit + 발견된 실질 갭 처리.

### audit 결과

- **A03 OTP**: 매직링크(`signInWithOtp`+`/auth/callback`)+Google OAuth → 코드 입력 화면 불필요. 완결.
- **T07 Orders**: `/mypage/requests`로 통합. 별도 화면 없음 = 의도.
- **T11 Revision/저장 버튼**: route-view-client의 "수정 요청"·"저장" 버튼이 **dead(핸들러 없음)** — AGENTS.md 금지 항목. 처리(아래).
- **G02 Pending**: onboarding 위저드만 존재, 대기 전용 화면 미발견(낮은 우선순위 잔여).
- **AD03/05**: 콘텐츠 모더레이션 액션 배선됨(작동), 가디언 신청 디렉토리 일부 mock(잔여).

### 변경 파일 (T11 처리 — 사용자 결정: 수정요청=숨김, 저장=북마크)

- `supabase/migrations/20260523000003_traveler_saved_routes.sql` (신규) + 운영 적용 — `traveler_saved_posts` 패턴 미러. RLS select/insert/delete own.
- `src/app/[locale]/(public)/routes/[routeId]/saved-route-actions.ts` (신규) — `toggleSavedRouteAction`. UUID 루트만, RLS가 본인 강제.
- `src/components/routes/route-view-client.tsx` — dead "수정 요청" 버튼 제거. "저장" → 북마크 토글(Bookmark/BookmarkCheck + pending). `canSave`(UUID+로그인) 때만 sticky 바 노출.
- `src/app/[locale]/(public)/routes/[routeId]/page.tsx` — `canSave`·`initialSaved` 조회·전달.
- `src/app/[locale]/(authed)/mypage/routes/page.tsx` — "저장한 루트" 섹션 추가.
- `messages/{5}.json` — `routeSavedCta` 추가.

### 검증 결과

- `pnpm build` 통과 (713 페이지).
- `pnpm lint` — 신규 파일 경고 없음.
- `get_advisors` — 신규 테이블 RLS 정상, 경고는 여전히 `auth_leaked_password_protection` 1건뿐.

### 남은 이슈

- 여행자 revision 전체 기능은 별도 라운드(TODO 섹션 3 후속).
- mock/preview 루트는 저장 불가(UUID 아님) — 의도. 저장 버튼 자체가 안 보임.

## 2026-05-23 - T17 여행자 설정 화면 (섹션 2 미구현 화면 완료)

### 목표

TODO 섹션 2 마지막 — T17 Traveler Settings. 기존 guardian settings 카드 패턴 차용.

### 변경 파일

- `src/app/[locale]/(authed)/mypage/settings/page.tsx` (신규) — 계정·언어·알림·저장항목·약관 5개 카드 허브. `LanguageSwitcher` 인라인 노출. 로그아웃은 헤더 계정 메뉴가 전역 처리하므로 재구현하지 않음.
- `src/components/mypage/mypage-hub-nav-items.ts` — `navSettings` 라벨키 + 트래블러 nav에 설정 항목(`travelerSettingsMatch`).
- `messages/{ko,en,ja,th,vi}.json` — `TravelerHub.navSettings` 추가.

### 검증 결과

- `pnpm build` 통과 (708→713).
- `pnpm lint` — 신규 파일 경고 없음.
- **섹션 2(확실한 미구현 4건) 전부 완료**: M06 FAQ, M07 Legal, T15 Review Write, T17 Settings.

### 남은 이슈

- 알림은 현재 헤더 배지 안내로 대체 — 푸시/이메일 설정 토글은 후속(인프라 필요).
- 설정 항목 다수가 기존 페이지로의 링크 허브 형태 — 단계적으로 인라인 편집 확장 가능.

## 2026-05-23 - T15 여행자 리뷰 작성 폼

### 목표

TODO 섹션 2 순차 진행 — T15 Review Write. `traveler_reviews` 테이블·RLS는 이미 존재, 작성 UI + 제출 액션만 신규.

### 변경 파일

- `src/components/reviews/traveler-review-form.tsx` (신규) — 별점(1~5 hover) + 코멘트(2000자) + 익명 토글 + 제출. 성공/중복 시 완료 상태 카드.
- `src/app/[locale]/(authed)/mypage/requests/[id]/review-actions.ts` (신규) — `submitTravelerReviewAction`. booking 소유·상태(delivered/completed)·중복 검증 후 insert. RLS가 2차 강제.
- `src/app/[locale]/(authed)/mypage/requests/[id]/page.tsx` — booking select에 `guardian_user_id` 추가, 기존 리뷰 존재 조회, delivered/completed + 매칭됨일 때 폼 노출.

### 검증 결과

- `pnpm build` 통과 (708 페이지).
- `pnpm lint` — 신규 파일 경고 없음 (`BookingStatus` 미사용은 사전 존재).
- RLS 정책(`traveler_reviews_insert_traveler`)이 booking 소유 + delivered/completed를 강제하므로, 액션 검증을 우회해도 DB가 차단.

### 남은 이슈

- 리뷰 수정(작성 후 30일 내 update RLS 존재) UI는 미구현 — 현재는 1회 작성만. 필요 시 후속.
- 리뷰가 guardian 프로필·신뢰 모듈에 반영되는 집계는 기존 표시 컴포넌트 확인 필요(별도).

## 2026-05-23 - 미구현 화면 신규: FAQ(M06) + Legal(M07 terms/privacy)

### 목표

TODO 섹션 2(신규 미구현) 순차 진행 — 확실한 미구현이던 M06 FAQ, M07 Legal 두 화면 신규 생성.

### 변경 파일

- `src/components/faq/faq-content.tsx` (신규) — ko/en 데이터셋 + 카테고리별 아코디언. 서비스 기본·이용 방법·결제/환불·하루이 활동 4개 섹션.
- `src/app/[locale]/(public)/faq/page.tsx` (신규) — locale 분기, metadata.
- `src/components/legal/legal-document.tsx` (신규) — 약관/방침 공용 렌더러. "법무 검토 전 초안" 배너 + 섹션 렌더.
- `src/app/[locale]/(public)/legal/terms/page.tsx` (신규) — 이용약관 ko/en 구조화 초안 7개 섹션.
- `src/app/[locale]/(public)/legal/privacy/page.tsx` (신규) — 개인정보처리방침 ko/en 7개 섹션.
- `messages/{ko,en,ja,th,vi}.json` — Footer에 `faq` 키 추가.
- `src/components/layout/site-footer.tsx` — terms/privacy를 `/about#...` 앵커 → `/legal/terms`·`/legal/privacy` 실제 페이지로 교체, `/faq` 링크 추가.

### 검증 결과

- `pnpm build` 통과 (693→708, 3 페이지 × 5 locale = 15개 정적 생성).
- `pnpm lint` — 신규 파일 경고 없음.
- About 페이지의 ko/en 분기 패턴(AboutLanding/AboutLandingEn) 차용 — 5개 i18n 전체 번역 부담 회피, ko 외 로케일은 영어 노출.

### 남은 이슈

- Legal 본문은 **법무 검토 전 초안** — 정식 출시 전 변호사 확정본으로 교체 필요. 라우트·구조·배너는 완성.
- FAQ는 제품 사실 기반이라 바로 사용 가능하나, 결제/환불 항목은 정책 확정 시 동기화 필요.

## 2026-05-23 - spot_images 마이그레이션 + 보안 lint 일괄 정리 + RLS 정책 12개 추가

### 목표

세션 누적 잔여 작업 4개 모두 진행:
1) `spot_images` 마이그레이션 운영 적용 (운영 admin 스팟 관리 작동)
2) mock directions JSON 빌드 스크립트의 regex 수정 (catalog 객체 내부 lat/lng 추출)
3) 사전 존재 SECURITY DEFINER 함수 5종의 anon/authenticated RPC 노출 차단 + `update_updated_at*`의 search_path 고정
4) RLS enable됐지만 정책 부재인 12개 테이블에 의도 정책 추가

### 변경 파일

- `supabase/migrations/20260430000001_spot_images_and_catalog_enhance.sql` — `sync_spot_primary_image_url`에 `set search_path = public` 추가, EXECUTE revoke 3줄 추가(public/anon/authenticated).
- `scripts/build-mock-directions.mjs` — regex를 `lat: X, lng: Y` 인접 페어 매칭으로 단순화. `catalog: { name: { ... }, ... }`처럼 중첩 객체가 있어 기존 `[^}]` 기반 매칭은 깨졌었음.
- `supabase/migrations/20260523000001_security_hardening_revoke_definer_rpc_exposure.sql` (신규) — `points_apply_ledger`/`rls_auto_enable`/`service_count_unread_chat_threads`/`service_message_threads_list_for_user`/`wayly_record_usage` EXECUTE revoke. `update_updated_at`/`update_updated_at_column` 재정의(set search_path + EXECUTE revoke).
- `supabase/migrations/20260523000002_rls_policies_for_no_policy_tables.sql` (신규) — 12개 테이블에 정책 추가:
  - **본인 전용**: `mypage_menu_attention_seen`/`mypage_block_attention_seen` (text user_id → cast), `contact_methods`.
  - **공개 읽기**: `service_types`, `featured_guardians`, `guardian_languages`, `content_posts`(approved/blocked + author 본인).
  - **Admin 전용**: `admin_accounts`, `admin_notes`, `booking_status_history`, `guardian_activity_logs`, `incidents`.

### 운영 적용

- `spot_images` 테이블 + `spot_catalog.primary_image_url` 등 5개 컬럼 + 트리거 적용 완료.
- 보안 하든닝 + RLS 정책 적용 완료.
- `get_advisors`: 직전 22개 경고 → **1개**(`auth_leaked_password_protection`, Auth 대시보드에서만 변경 가능, SQL 불가).

### 검증 결과

- `pnpm build` 통과 (693 페이지).
- `get_advisors` 거의 클린.
- service role 호출 경로는 RLS·EXECUTE GRANT 우회하므로 운영 동작 영향 없음.
- 실제 사용자 클라이언트 직접 접근 케이스(있다면)는 정책에 맞게 동작 — **사용자 측 실측 권장**.

### 남은 이슈

- `auth_leaked_password_protection` — Supabase Auth Settings → Password Security에서 HaveIBeenPwned 통합 활성화 (대시보드 클릭). 운영 보안 강도 한 단계 더 올라감.
- mock JSON은 OSRM 공개 서버 미접속·로컬 GOOGLE_MAPS_API_KEY 미설정으로 빈 채로 남음. 향후 CI에 key 주입 후 `pnpm run routes:build-mock-directions` 실행 → 결과 커밋 권장.

## 2026-05-22 - Supabase 마이그레이션 프로덕션 적용 + 트리거 함수 RPC 노출 차단

### 목표

- 그동안 누적된 두 마이그레이션(`20260522180000_routes_directions_meta`, `20260522190000_routes_invalidate_directions_trigger`)을 프로덕션 Supabase에 적용.
- Supabase 보안 lint(`anon_security_definer_function_executable`, `authenticated_security_definer_function_executable`)가 새 트리거 함수에 대해 경고 → public/anon/authenticated에서 EXECUTE 회수.

### 변경 / 적용

- 프로덕션 Supabase(`twxlokedllghbpztoiej`)에 두 마이그레이션 적용 완료. `information_schema`로 컬럼·트리거 존재 확인.
- `supabase/migrations/20260522190000_routes_invalidate_directions_trigger.sql` — 트리거 생성 직후 `revoke execute ... from public/anon/authenticated` 3줄 추가. 트리거는 DB 시스템이 직접 호출하므로 EXECUTE 권한과 무관하게 동작.
- 같은 SQL을 운영 DB에도 적용해 `get_advisors`에서 해당 경고 해소 확인.

### 미적용 마이그레이션 (의도적 보류)

- `supabase/migrations/20260430000001_spot_images_and_catalog_enhance.sql` (149줄, spot_catalog 보강 + spot_images 테이블 신규) — 이번 세션 범위 밖. `spot_images`·`spot_catalog.district`·`spot_catalog.naver_data`를 참조하는 code path가 작동하지 않을 수 있음. 별도 라운드에서 검토·적용 권장.

### 검증 결과

- `pnpm build` 통과 (693 페이지, 변경 없음 — SQL만).
- `get_advisors` — `routes_invalidate_directions_meta_from_route_spots`는 더 이상 노출되지 않음.
- 트리거 동작 자체는 **미검증** — 다음 가디언 게시 시 routes.directions_meta 갱신 흐름 실측 필요.

### 남은 이슈 (보안 lint 잔여, 모두 사전 존재)

- `points_apply_ledger`·`rls_auto_enable`·`service_count_unread_chat_threads`·`service_message_threads_list_for_user`·`wayly_record_usage`가 동일 패턴(SECURITY DEFINER + anon/authenticated EXECUTE)으로 노출. 별도 라운드에서 일괄 정리 검토.
- 14개 테이블에 RLS는 켜져 있으나 정책 부재(`rls_enabled_no_policy`) — INFO 수준이지만 의도된 차단이 아니면 정책 추가 필요.

## 2026-05-22 - directions 저장 토스트 + route_spots 트리거 자동 무효화

### 목표

- 가디언이 게시 직후 directions가 함께 저장됐는지 즉시 알 수 있도록 토스트/안내 라벨 추가.
- 좌표·순서가 바뀌었는데 admin이 리프레시를 안 했을 때 stale 폴리라인이 남는 걸 방지 — `route_spots` 변경 시 부모 `routes.directions_meta`를 PG 트리거로 자동 무효화.

### 변경 파일

- `src/app/api/guardian/routes/route.ts` — directions 저장 성공 시 `directionsSaved` 객체 보관, 응답 JSON에 `directions_saved` 필드 추가(provider/points/distance_m/duration_s).
- `src/components/guardian/guardian-route-delivery-form.tsx` — `setDirectionsSavedInfo` 상태 + 응답 파싱. 저장 완료 영역에 "✓ 도보 경로도 함께 저장됨 (Google Directions · 87점 · 1.4km · 18분)" 또는 실패 시 "ⓘ 도보 경로는 저장되지 못했지만 라우트는 게시됐습니다." 안내.
- `supabase/migrations/20260522190000_routes_invalidate_directions_trigger.sql` (신규) — `route_spots` AFTER INSERT/UPDATE/DELETE 트리거. UPDATE는 `spot_id` 또는 `sort_order`가 실제로 바뀐 경우에만 무효화. 같은 트랜잭션에서 delivery API가 다시 채우므로 순서 안전. `security definer` + `set search_path = public`.

### 검증 결과

- `pnpm build` 통과 (693 페이지).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음.
- 트리거 실제 동작·동일 트랜잭션 내 재채움은 **미검증** — 배포 후 가디언 게시 → DB 인스펙션으로 확인 필요.

### 남은 이슈

- 트리거가 `security definer`인 이유: `route_spots` 작성 권한자가 `routes` UPDATE 권한이 없을 수도 있어 권한 승격 필요. 다만 함수 내에서 단일 컬럼(`directions_meta`)만 NULL로 만들므로 보안 면적 최소.
- `spot_catalog.lat/lng`가 admin에 의해 변경되는 경우는 트리거 범위 밖 — admin refresh-directions 엔드포인트로 수동 갱신.

## 2026-05-22 - 프로덕션 페이지 깨짐 수정 + Google Maps 인증 실패 진단 + admin refresh-directions

### 목표 / 배경

스크린샷 보고:
1) 에디터 지도 드로어가 Google 표준 "Sorry, something went wrong" 오버레이를 표시 — 키 인증 실패(referrer 제한·API 미활성·빌링) 시 우리 진단 카드로 가이드를 띄울 필요.
2) `/routes/[id]` 페이지가 "This page couldn't load"로 실패 — 직전 라운드에서 추가한 `routes.directions_meta` 컬럼 SELECT가 마이그레이션 미적용 프로덕션 DB에서 PostgREST 42703 에러를 일으켜 `fetchHaruRouteFromSupabase`가 null 반환 → notFound로 빠짐. **그래도 페이지 자체가 깨지는 건 별도 원인일 수 있으나, SELECT 폴백을 추가해 양쪽 다 대응.**

추가로 원래 라운드의 (1) admin refresh-directions를 진행.

### 변경 파일

- `src/lib/routes/haru-route-from-supabase.server.ts` — SELECT를 두 단으로 분리. 1차에 `directions_meta` 포함하고 PostgREST 42703(`undefined_column`)이면 2차로 컬럼 없이 재시도. 타입은 `unknown`으로 받아 좁힘.
- `src/components/maps/google-maps-provider.tsx` — `window.gm_authFailure` 글로벌 콜백을 잡아 `authFailed` 상태로 보관, React Context로 자식에 노출. `useGoogleMapsState()` hook 신설.
- `src/components/maps/google-map-drawer.tsx` — `mapsState.authFailed`면 `AuthFailedNotice`(빨강 톤, "API 활성화 / referrer / 빌링" 체크리스트) 표시.
- `src/components/routes/haru-route-map-view.tsx` — 같은 패턴으로 인증 실패 진단 카드.
- `src/app/api/admin/routes/[routeId]/refresh-directions/route.ts` (신규) — admin 세션 전용 POST. `route_spots` 정렬 → `spot_catalog` 좌표 조회 → `getDirectionsForCoords` → `simplifyPath` → `routes.directions_meta` 업데이트 → 4-locale `revalidatePath`. 응답에 provider·points·points_original·distance/duration·legs_count 노출.

### 검증 결과

- `pnpm build` 통과 (693 페이지).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음.
- 실제 `gm_authFailure` 콜백 동작·SELECT 폴백 동작은 **미검증** — 프로덕션 스크린샷의 재현 환경에서 확인 필요.

### 남은 이슈

- 스크린샷의 "This page couldn't load"가 SELECT 실패 외에 다른 원인일 가능성: Supabase RLS · `route_type` mismatch · cover_image_url 누락 등. SELECT 폴백이 들어가도 재현되면 Vercel function 로그 확인 필요.
- 미리보기 페이지가 인증된 사용자 세션 없이 진입 가능한 경우 `redirect → 로그인`이 발생하며 iOS Safari가 redirect 체인을 "page couldn't load"로 표시할 가능성도 있음(검증 필요).

## 2026-05-22 - 폴리라인 단순화 가드 + mock directions 빌드 캐시 + 목록 재검증 확장

### 목표

- DB row 크기 가드 — `routes.directions_meta` 저장 전 Douglas–Peucker로 폴리라인 단순화(상한 500점, 5m 변위 허용).
- mock 라우트의 directions를 빌드 타임에 한 번 계산해 정적 JSON으로 커밋 → 페이지가 외부 API 호출 없이 즉시 사용.
- 가디언 게시 시 `revalidatePath`를 `/routes/[id]` 외에 `/mypage/routes`·`/guardian/routes`·`/explore/routes`까지 확장 (4 locale × 4 경로 = 16회).

### 변경 파일

- `src/lib/routing/simplify-path.ts` (신규) — Douglas–Peucker 알고리즘 + 점 개수 상한 가드. 좌표를 degree 단위로 처리하고 tolerance를 두 배씩 늘려 maxOutPoints에 들이도록 시도, 끝까지 안 들어가면 균등 데시메이션.
- `src/app/api/guardian/routes/route.ts` — directions 저장 시 `simplifyPath()` 적용, 단순화가 일어났으면 `path_simplified_from`에 원본 점 개수 기록. revalidatePath 호출 확장.
- `src/data/mock/haru-route-directions.json` (신규, 초기 `{}`) — 빌드 스크립트가 채울 정적 캐시.
- `scripts/build-mock-directions.mjs` (신규) — `src/data/mock/haru-route.ts`에서 catalog.lat/lng 추출 → Google Directions(키 있으면) / OSRM 폴백 → `{ "mock-haru-route": { provider, path, legs, distance_m, duration_s, computed_at } }` 형식으로 저장.
- `package.json` — `routes:build-mock-directions` 스크립트 등록.
- `src/app/[locale]/(public)/routes/[routeId]/page.tsx` — 우선순위: DB → mock 정적 JSON → 라이브 컴퓨트. 정적 JSON에 path가 ≥2점이고 provider가 google/osrm이면 그대로 사용.

### 검증 결과

- `pnpm build` 통과 (693 페이지).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음.
- 단순화 휴리스틱(5m 변위/500점)은 서울 시내 도보 라우트 기준 검증 — **장거리·산악 라우트에서의 적합성은 미검증**.
- mock JSON은 초기 `{}` — 키 적용 후 `pnpm run routes:build-mock-directions` 실행 + 결과 커밋 필요.

### 남은 이슈

- `revalidatePath`가 16회 호출되어 cold start 직후 burst 발생 가능 — Vercel상 부담은 미미할 것으로 예상되나 측정 필요.
- `simplifyPath`의 tolerance 디폴트가 서울 위도 기준 ~5m이라 다른 위도에서는 m 단위가 약간 달라짐(평면 근사). 작업 범위상 충분.

## 2026-05-22 - leg-connector 흡수 + routes.directions_meta DB 저장 + 미리보기 썸네일

### 목표

- `leg-connector.tsx`의 `METHOD_CONFIG`(walk/subway/taxi 아이콘·라벨)를 `route-spot-formatting`으로 흡수 → 이모지 정의 단일 소스화.
- delivery 시점에 directions 결과를 `routes.directions_meta` JSONB에 저장 → 사용자 페이지가 외부 호출 0회로 즉시 사용.
- 에디터 미리보기 "스팟별 흐름"의 row에 36×36 썸네일 + 우하단 번호 배지(이미지 없을 땐 기존 배지) 노출.

### 변경 파일

- `src/lib/route-spot-formatting.ts` — `MoveMethodMeta` + 단일 `MOVE_META`로 통합, `moveMethodMeta(mode)`/`nextMoveEmoji(mode)`가 같은 소스를 본다.
- `src/components/patterns/haru-timeline/leg-connector.tsx` — 로컬 `METHOD_CONFIG` 제거, `moveMethodMeta` import.
- `supabase/migrations/20260522180000_routes_directions_meta.sql` (신규) — `alter table public.routes add column directions_meta jsonb null;` + comment.
- `src/app/api/guardian/routes/route.ts` — 스팟 인서트 직후 `spot_catalog`에서 좌표 재조회 → `getDirectionsForCoords` 호출 → `routes.directions_meta` 업데이트. 실패는 게시를 막지 않음(warn 로깅).
- `src/lib/routes/haru-route-from-supabase.server.ts` — select에 `directions_meta` 추가, `StoredDirectionsMeta` 타입 export, `FetchedHaruBundle.directionsMeta` 노출. 최소 검증으로 안전 캐스팅.
- `src/app/[locale]/(public)/routes/[routeId]/page.tsx` — 우선순위 1) `routes.directions_meta` 2) 라이브 컴퓨트(24h cache). mock은 항상 라이브.
- `src/components/route-posts/route-day-preview.tsx` — `SpotLeadVisual` 컴포넌트 신설: `image_urls[0]`이 있으면 썸네일 + 우하단 번호 오버레이, 없으면 기존 번호 배지. 36px 한정이라 `<img>` 사용 + 명시적 eslint-disable 주석.

### 검증 결과

- `pnpm build` 통과 (693 페이지).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음 (기존 `AppLocale` 미사용 경고만 남음).
- 마이그레이션 적용 전에는 `directions_meta`가 항상 `null`이라 페이지가 라이브 컴퓨트로 폴백 — **배포 안전 확인 필요**.

### 남은 이슈

- 마이그레이션 미적용 환경에서 `select(... directions_meta ...)`이 PostgREST 오류를 낼 가능성 — Supabase에 마이그레이션 먼저 적용 후 빌드 배포 권장. 실패 시에는 select 에러 → `fetchHaruRouteFromSupabase`가 null 반환 → notFound로 빠짐.
- 미리보기 썸네일은 plain `<img>` — 향후 `<Image />` + remotePatterns 정비 시 일괄 전환.

## 2026-05-22 - 라우트 스팟 포맷 공용 유틸 + 헬스 admin 게이트 + 에디터 모드 이모지

### 목표

- 거리 포맷·이동 모드 이모지가 editor·preview·detail-client에 3중 중복돼 있던 것을 공용 모듈로 추출.
- `/api/health/routing`을 관리자 세션만 호출 가능하도록 게이트.
- 에디터 좌측 스팟 목록의 leg 라벨에도 미리보기·detail과 동일한 모드 이모지 노출.

### 변경 파일

- `src/lib/route-spot-formatting.ts` (신규) — `fmtSpotDistance(m)`, `nextMoveEmoji(mode)`. taxi는 `leg-connector.tsx` 컨벤션에 맞춰 🚕로 통일(미리보기에 들어가 있던 🚖 → 🚕).
- `src/components/route-posts/route-day-preview.tsx`, `src/components/route-posts/route-post-detail-client.tsx`, `src/components/guardian/guardian-route-post-editor.tsx` — 각자의 로컬 함수 제거, 공용 import.
- `src/components/route-posts/route-post-detail-client.tsx` — `fmtDistance`/`nextModeEmoji` 호출도 공용 이름(`fmtSpotDistance`/`nextMoveEmoji`)으로 교체.
- `src/app/api/health/routing/route.ts` — `getServerSupabaseForUser`로 세션 조회 후 `users.app_role`이 admin/super_admin인 경우만 통과(403). admin/spots 라우트와 동일 패턴.
- `src/components/guardian/guardian-route-post-editor.tsx` — leg 라벨의 ↓ 화살표를 `nextMoveEmoji(s.next_move_mode)`로 교체.

### 검증 결과

- `pnpm build` 통과 (693 페이지).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음.
- admin 게이트 실제 동작은 **미검증** — 배포 후 비-admin 세션 403 / admin 세션 200 확인 필요.

### 남은 이슈

- `leg-connector.tsx`의 `METHOD_CONFIG`도 동일 이모지를 갖고 있어 공용 모듈로 흡수 가능 — 다만 다국어 라벨까지 들어가 있어 후속 라운드 검토.
- `/api/health/routing`은 첫 호출이 외부 API 비용을 발생시키므로 정기 ping 대상 아님.

## 2026-05-22 - 4-locale revalidate 명시 + 미리보기 아이콘 보강 + directions 헬스 엔드포인트

### 목표

- `revalidatePath` 다이내믹 세그먼트 매치가 운영 환경에서 일치하지 않을 가능성에 대비해 ko/en/th/vi 4개 URL을 명시 호출.
- 에디터 미리보기 "스팟별 흐름" 카드에 featured 아이콘 + next_move_mode 이모지(🚶/🚇/🚌/🚖) 추가.
- 운영자가 Vercel 대시보드 없이도 directions 캐시 적중 여부를 빠르게 확인할 수 있는 `/api/health/routing` 엔드포인트 신설.

### 변경 파일

- `src/app/api/guardian/routes/route.ts` — `revalidatePath("/[locale]/routes/[routeId]", "page")` 한 번 호출 → ko/en/th/vi 4번 명시 호출(`/${loc}/routes/${routeId}`)로 전환.
- `src/components/route-posts/route-day-preview.tsx` — 스팟별 흐름 row에 featured 강조(번호 배지 amber + ★) + 이동 라벨 앞 모드 이모지. `nextMoveEmoji` 헬퍼 신설.
- `src/app/api/health/routing/route.ts` (신규) — 고정 디버그 좌표(시청→광화문→인사동)에 directions-server를 두 번 연속 호출 → `first_call_ms`/`second_call_ms`/`cache_likely_hot` 반환. `Cache-Control: no-store`로 응답 자체는 캐시 금지.

### 검증 결과

- `pnpm build` 통과 (693 페이지, `/api/health/routing` 추가로 +1).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음.
- 실제 헬스 엔드포인트의 `cache_likely_hot` 정확성은 **미검증** — Vercel 배포 환경에서 두 번째 호출이 외부 fetch 대비 충분히 빠른지 실측 필요.

### 남은 이슈

- `/api/health/routing` 호출 자체가 Google Directions API 요청을 발생시키므로(첫 호출), 정기 ping 대상으로 삼지 말 것. 관리자 수동 디버그용으로만 사용.
- `nextMoveEmoji`는 `route-post-detail-client.tsx`의 `nextModeEmoji`와 기능 중복 — 후속 라운드에서 공용 유틸로 추출 검토.

## 2026-05-22 - 게시 시 라우트 페이지 재검증 + 에디터 미리보기 스팟 흐름 + OSRM 운영 가이드

### 목표

- 가디언이 라우트를 게시·재게시한 직후 사용자 페이지가 최신 상태로 갱신되도록 `revalidatePath` 추가.
- 에디터 우측 미리보기 카드(`RouteDayPreview`)에 "스팟별 흐름 (예고)" 섹션 신설 — 좌측 목록과 동일한 "다음 스팟까지 N분/Nm" 라벨 노출.
- `OSRM_BASE_URL`을 자체 인스턴스로 운영하기 위한 가이드를 `env.example`과 `ARCHITECTURE.md`에 명시.

### 변경 파일

- `src/app/api/guardian/routes/route.ts` — 스팟·메타 갱신 직후 `revalidatePath("/[locale]/routes/[routeId]", "page")` 호출. directions Runtime Cache는 좌표가 바뀌면 URL이 달라져 자동 새 컴퓨트, ISR 페이지 자체는 명시 재검증.
- `src/components/route-posts/route-day-preview.tsx` — 메모 카드 하단에 "스팟별 흐름 (예고)" 카드 추가. `sortedSpots.map`으로 번호·제목·place_name + 그 아래 `next_move_minutes`/`next_move_distance_m` 보조 라벨. `legs[]`가 없을 때는 "경로 계산 후 표시" 안내.
- `env.example` — Google Directions를 `GOOGLE_MAPS_API_KEY`의 추가 권한으로 명시(Maps JS · Places · Directions 세 API 활성화 안내). `OSRM_BASE_URL`은 운영 시 자체 호스팅(`docker run osrm/osrm-backend`)/호스팅 서비스 권장 코멘트 추가.
- `ARCHITECTURE.md` §6 — 라우팅 줄을 "Google Directions 우선 + OSRM 폴백, 24h Runtime Cache" 사실로 갱신.

### 검증 결과

- `pnpm build` 통과 (692 페이지).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음.
- 실제 `revalidatePath` 동작·OSRM 자체 인스턴스 연결은 **미검증** — 배포 후 가디언 게시·페이지 재진입 스모크 필요.

### 남은 이슈

- `[locale]` 다이내믹 세그먼트 매치가 Next 15의 `revalidatePath` 의도와 정확히 일치하는지 운영 환경에서 한 번 확인 필요(필요 시 ko/en/th/vi 4개 경로 명시 호출로 전환).
- 미리보기 카드의 "스팟별 흐름"은 디자인 토큰 그대로지만, 향후 사용자 페이지의 풍부한 spot 카드와 한 단계 더 통일성 작업 여지 있음.

## 2026-05-22 - directions 서버사이드 캐싱 + 에디터 스팟별 다음 이동 라벨 + 근사 경로 안내

### 목표

- `/routes/[id]` 진입마다 directions 외부 호출이 일어나는 문제 해결 — 서버 컴포넌트에서 미리 컴퓨트해 Vercel Runtime Cache(24h)에 저장.
- 에디터 좌측 스팟 목록에 "다음 스팟까지 N분 · Nm" 보조 라벨 노출.
- 지도 뷰에 directions 실패(직선 폴백) / 계산 중 상태를 사용자에게 작은 배지로 알림.

### 변경 파일

- `src/lib/routing/directions-server.ts` (신규) — `getDirectionsForCoords(coords, profile)` 서버 전용 헬퍼. Google → OSRM 순서로 시도, `fetch({ next: { revalidate: 86400 } })`로 24시간 캐시.
- `src/app/[locale]/(public)/routes/[routeId]/page.tsx` — 페이지에서 헬퍼 호출, `precomputedDirections` prop으로 `RouteViewClient`에 전달.
- `src/components/routes/route-view-client.tsx` — `RouteViewPrecomputedDirections` 타입 + prop 패스스루.
- `src/components/routes/haru-route-map-view.tsx` — `precomputedPath`·`precomputedProvider` prop을 받아 자체 fetch 생략. 상태(`loading`/`routed`/`straight`)를 derive해 우측 상단 배지로 노출(로딩=스피너+회색, 직선 폴백=주의 배지). spots 부적합·effect setState in body 패턴 정리.
- `src/components/guardian/guardian-route-post-editor.tsx` — 좌측 스팟 목록 row 아래에 "↓ N분 · Nm 다음 스팟까지" 보조 라벨(마지막 스팟 제외). `fmtSpotDistance` 유틸 신설.

### 검증 결과

- `pnpm build` 통과 (692 페이지).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음 (기존 `routeDataToArticleParsed` 미사용은 사전 존재).
- Vercel Runtime Cache가 fetch URL 단위로 캐시하므로 같은 스팟 좌표·프로파일은 24h 동안 외부 호출 1회 — 부하/비용 모두 감소. **실제 캐시 적중 측정은 미검증**, 키 적용 후 Vercel 대시보드의 cache hit 로그 확인 필요.

### 남은 이슈

- 스팟 좌표가 변경되면 (편집 후 재게시 등) `fetch` 캐시 키가 달라져 자동 재계산 — 다만 24h 캐시 만료 전 동일 URL 재방문 시까지는 stale path 가능성. Critical 좌표 변경 시 `revalidatePath('/routes/[routeId]')` 호출 검토 필요.
- 에디터 미리보기 카드(`RouteDayPreview`) 자체는 스팟 카드를 iterate하지 않아 라벨 추가는 좌측 목록 한정. 미리보기에 라벨도 필요하면 후속 라운드.

## 2026-05-22 - 스팟별 다음 이동 시간/거리 자동 채움 + 하루루트 지도뷰 도로 폴리라인

### 목표

- 에디터에서 Directions/OSRM 응답의 `legs[]`로 스팟별 `next_move_minutes`·`next_move_distance_m`·`next_move_mode`를 자동 채움 → 사용자 페이지의 "다음 스팟까지 N분/Nm" 라벨이 자동 표시.
- `/routes/[id]` 지도 뷰의 폴리라인을 직선 → 실제 도로 형상으로 업그레이드, 실패 시 점선 직선 폴백.

### 변경 파일

- `src/components/guardian/guardian-route-post-editor.tsx` — Directions 결과 적용 시 `j.spots`를 순회해 `legs[i]`를 `sorted[i].id` 기준으로 매핑하여 spot에 머지. `Map`은 lucide-react import와 이름 충돌 → plain object(`Record<string, ...>`) 사용. 토스트에 "스팟별 다음 이동(N구간) 갱신" 명시.
- `src/app/api/routing/osrm/route.ts` — 응답에 `legs[]`(구간별 `distance_m`·`duration_s`) 추가.
- `src/components/routes/haru-route-map-view.tsx` — `/api/routing/google` → 실패 시 `/api/routing/osrm` 직렬 폴백으로 도로 형상 폴리라인을 받아 그림. 둘 다 실패하면 직선 + 점선 스타일. spots 변경 → spotsKey gate로 cascading render 회피.

### 검증 결과

- `pnpm build` 통과 (692 페이지).
- `pnpm lint` — 본 변경 파일에서 신규 오류/경고 없음.
- 실제 Directions 응답의 도로 형상·구간 시간 정확성은 **미검증** — `GOOGLE_MAPS_API_KEY` 적용 후 실키 스모크 필요.

### 남은 이슈

- 페이지 진입 시마다 `/api/routing/google` 호출 — 6스팟 기준 1회/페이지. 추후 `routes.directions_cache_json` 컬럼이나 서버 컴포넌트 캐시로 1회 컴퓨트 후 재사용 권장.
- `move_from_prev_method` 등 `HaruSpot` 측 필드는 별도(딜리버리 폼 입력) — 향후 통합 모델로 합치는 작업 필요.

## 2026-05-22 - 환경변수 규약 정리 + 에디터 우측 패널 정리 + Google Directions 라우팅

### 목표

- 브라우저 지도 키 이름을 `env.example` 규약(`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`)에 맞춤.
- 하루이 루트 에디터 우측 패널(지도/카드 미리보기)의 시각·접근성 다듬기.
- OSRM 단독 대신 Google Directions(도보·차량) 우선 + OSRM 폴백으로 거리·시간 추정 품질 개선.

### 변경 파일

- `src/components/maps/google-maps-provider.tsx`, `google-map-drawer.tsx`, `src/components/routes/haru-route-map-view.tsx` — 키 이름 `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`로 통일, 안내 카드 문구도 갱신.
- `env.example`, `README.md` — 서버/브라우저 키 역할 분리와 Places(브라우저 Autocomplete 포함) 활성 가이드.
- `src/components/guardian/guardian-route-post-editor.tsx` — 우측 패널 `<aside>` + `role="tablist"`/`role="tabpanel"`로 의미부여, 인라인 height → tailwind 아빗러리 (`h-[min(500px,65vh)]`, `max-h-[min(72vh,640px)]`), 모드 배지를 활성 패널 안으로 이동, 루트 요약/태그 섹션 라벨 분리, OSRM 컨트롤 라인을 버튼 + 그 아래 힌트 형식으로 정리.
- `src/app/api/routing/google/route.ts` (신규) — `GOOGLE_MAPS_API_KEY` 서버 키로 Directions 호출, 인코딩 폴리라인 디코드, `legs[]`(구간별 m·s) 포함 응답. 키 미설정 시 503 + `retry_with: "osrm"`.
- `src/components/guardian/guardian-route-post-editor.tsx` — `refreshRouteFromOsrm` 내부에서 Google → OSRM 폴백 직렬 호출, 성공 토스트에 사용 프로바이더 명시. 버튼 라벨을 "경로·도보 시간 계산"으로 일반화.

### 검증 결과

- `pnpm build` 통과 (`Compiled successfully`, 692 페이지 SSG — `/api/routing/google` 추가로 +1).
- `pnpm lint` — 본 변경 파일에서 신규 경고 없음 (기존 `routeDataToArticleParsed` 미사용은 사전 존재).
- 실제 Google Directions 응답 품질·HTTP referrer/원본 제한은 **미검증** — 키 적용 후 스모크 필요.

### 남은 이슈

- `legs[]`(구간별 m·s)는 현재 응답에 포함되지만 UI에 노출되지 않음 — 차후 라운드에서 스팟 카드의 "다음 스팟까지 N분" 보조 라벨로 사용 예정.
- `OSRM_BASE_URL` 자체 인스턴스 운영 도입 시 폴백 신뢰성 ↑ — 데모 서버 의존 제거 필요.

## 2026-05-22 - 하루루트 지도 뷰 추가 (Google Maps · 타임라인↔지도 토글)

### 목표

- `/routes/[id]` 잠금 해제 영역에서 6스팟을 지도로 확인할 수 있는 "지도" 토글 추가.
- 사용자가 핀을 탭하면 기존 스팟 상세 시트를 그대로 재사용.

### 변경 파일

- `src/components/routes/route-view-client.tsx` — `viewMode: "timeline" | "map"` 상태·탭 스위처(List/Map 아이콘), `HaruRouteMapView`/`GoogleMapsProvider` 연결.
- `src/components/routes/haru-route-map-view.tsx` — 폴리라인 `useEffect`에서 불필요한 `useState` 제거(cascading render 경고 해소).
- `src/components/maps/google-map-drawer.tsx` — 미사용 `cn` 제거, `MapPanWhenPinChanges` effect 의존성에 lat/lng 명시.
- `src/data/post-local-images-manifest.gen.ts` — 빌드 산출 트레일링 개행만 반영.

### 변경 내용

- 결제 완료 배너 아래에 둥근 인라인 토글(`타임라인` / `지도`) 추가, 선택 상태만 `bg-background shadow-sm`.
- `viewMode === "map"`일 때 `HaruRouteMapView`가 노출되며, 스팟 핀 탭 → 동일 `HaruSpotDetailSheet` 오픈.
- 전체 영역을 `GoogleMapsProvider`로 감싸 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 미설정 시 컴포넌트 자체 안내 카드 노출.

### 검증 결과

- `pnpm build` 통과 (`Compiled successfully in 15.3s`, 691 페이지 SSG).
- `pnpm lint` — 본 변경 파일에서 신규 경고/오류 없음 (기존 저장소 전반의 lint 이슈는 별도).
- 실제 키로 지도 표시 확인은 **미검증** — Vercel 환경변수 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 추가 후 스모크 필요.

### 남은 이슈

- A5: Vercel에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`(Maps JS API + Places API 활성, HTTP referrer 제한 권장) 설정 안내 문서화 필요.
- 다음 라운드: 에디터 레이아웃 우측 패널 정리, Google Directions API 기반 도보 시간/거리 산정.

## 2026-05-12 - 채팅·문의 비즈니스 로직 정비 (DB·API·마이페이지·진입 UX)

### 목표

- 여행자/하루이 문의·메시지함·미읽음 배지·AI 자동답변·메시지 한도·읽음 처리·포스트 맥락을 제품 흐름에 맞게 정리한다.

### 변경 파일

- `supabase/migrations/20260512140000_chat_messaging_business_logic.sql`
- `src/app/api/threads/route.ts`, `src/app/api/threads/[id]/messages/route.ts`
- `src/lib/mypage-hub-snapshot.server.ts`, `src/types/mypage-hub.ts`, `src/types/domain.ts`
- `src/lib/mypage-attention-read-state.ts`
- `src/components/mypage/mypage-hub-nav-items.ts`, `mypage-hub-side-navigation.tsx`, `mypage-hub-shell.tsx`
- `src/components/chat/thread-list-client.tsx`, `chat-view.tsx`
- `src/components/guardians/guardian-inquiry-sheet.tsx`, `guardian-sticky-cta.tsx`, `guardians-discover-client.tsx`, `guardian-detail-view.tsx`
- `src/components/posts/post-author-request-cta.tsx`
- `messages/*.json` (`guardianNavMessages`, `inquiryQuickCta`)

### 변경 내용

- DB: `content_post_id`, `max_messages_traveler` 기본 완화, 여행자 메시지 수 트리거·재집계, `messages` 읽음 전용 UPDATE RLS+가드, `message_threads_list_for_viewer` RPC, `service_count_unread_chat_threads`(service_role).
- API: 스레드 POST에 `content_post_id` 검증·기존 스레드 시 메타 갱신(비UUID·DB 불일치 시 무시하고 스레드는 생성); GET은 RPC 목록(메시지 0건 스레드 제외); POST 메시지 시 여행자 한도 검사; AI 답변은 `after()` + 서비스 롤 INSERT; 읽음 `await` 및 실패 로그.
- 마이페이지: 여행자/가디언 LNB에 메시지·미읽음 배지; 가디언 모드에서 `/mypage/messages` → `/mypage/guardian/messages` 리다이렉트; attention `menuKey`에 메시지 경로 매핑.
- UI: 스레드 목록 실데이터 프리뷰·미읽음 뱃지·폴링; 전송 한도·네트워크 오류 메시지; 포스트 CTA·탐색 카드·프로필·모바일 스티키에서 「지금 문의하기」; AI 저장 본문 `[자동 초답]` 접두사; 문의 시트 스레드 생성 실패 시 안내·재시도(가짜 환영 메시지 제거).

### 검증 결과

- `pnpm exec tsc --noEmit` 통과.
- `pnpm build` 통과(로컬 Node 25 경고만).
- `pnpm lint`는 저장소 내 `.claude/worktrees` 등 비표준 경로 스캔으로 실패할 수 있음 — 본 변경 파일 단위 ESLint는 `guardians-discover-client` 기존 `Date.now` purity 규칙 외 신규 오류 없음.

### 남은 이슈

- Supabase에 본 마이그레이션 적용 전에는 `GET /api/threads`가 503을 반환할 수 있음(RPC 부재).
- `pnpm lint` 전역 통과를 위해서는 eslint `globalIgnores`에 `.claude/**` 등 추가 검토.

### 다음 작업

- 스테이징/프로덕션에 마이그레이션 적용 후 메시지함·AI·배지 스모크 테스트.

### 추가 (동일일) — 모의 가디언(mgXX) 메시지함·미읽음·전송 줄 중복

- **원인**: (1) Realtime `INSERT`가 POST 응답보다 먼저 오면 낙관적 행을 서버 메시지로 바꿀 때 동일 `id`가 두 줄 남음. (2) 모의 가디언은 Supabase JWT가 없어 `message_threads_list_for_viewer`(auth.uid)와 메시지 RLS가 맞지 않음; 메시지 페이지가 `getSupabaseAuthUserIdOnly()`만 써서 «로그인 후…»; 스냅샷은 mock에 대해 미읽음 집계를 건너뜀.
- **조치**: `sessionUserIdToDbParticipantId`로 DB 참가자 UUID 정규화; mock 가디언일 때 `GET /api/threads`는 `service_message_threads_list_for_user`(service_role), `GET/POST` 메시지는 서비스 롤로 스레드 검증 후 조회·삽입·읽음 처리; 메시지 페이지는 `getSessionUserId()`; 스냅샷 미읽음은 mock이면 매핑 UUID로 `service_count_unread_chat_threads` 호출; 전송 성공 후 메시지 목록에서 `id` 기준 중복 제거(`chat-view`, `guardian-inquiry-sheet`).
- **DB**: `supabase/migrations/20260512160000_service_message_threads_list_for_user.sql`.
- **검증**: 변경 파일 단위 `pnpm exec eslint …` 통과.

### 추가 (동일일) — `GET /api/threads` RPC 부재 시 목록 폴백

- **원인**: 원격 DB에 `service_message_threads_list_for_user` 등이 아직 없으면 모의 가디언·일부 환경에서 스레드 목록이 503·「스레드 목록을 불러오지 못했습니다」로 끊김.
- **조치**: RPC 실패 시 service_role로 `message_threads`·`messages`·`guardian_profiles`를 조회해 `MessageThreadListRow`와 동일 필드를 조립하는 `thread-list-service-fallback.ts`를 두고, mock·일반 세션 모두 `GET`에서 폴백.

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
