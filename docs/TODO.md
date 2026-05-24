<!-- markdownlint-disable-file MD013 MD024 -->
# 개발 TODO / 진척 현황 (Korea SafeMate v6)

> 작성: 2026-05-23 · 기준: `IA_SCREEN_INVENTORY.md` §11 릴리즈 범위 매트릭스
> 범례: ✅ 라우트+컴포넌트 존재 / 🟡 부분·검증필요 / ❌ 미구현 / `[P]` 프로덕션 MVP · `[L]` Later
> **주의:** 본 audit은 "라우트 파일 + 컴포넌트 존재 여부"까지만 확인한 것. 기능 완성도(데이터 연결·엣지케이스)는 별도 QA 필요.

---

## 0. 즉시 조치 (운영 — 코드 외부)

- [ ] **Supabase Leaked Password Protection 토글 ON** — Dashboard → Authentication → Password Security. 마지막 보안 advisor 1건 해소. (SQL 불가, 대시보드 전용)
- [ ] **CI에 `GOOGLE_MAPS_API_KEY` 주입 후 `pnpm run routes:build-mock-directions` 실행 → 결과 커밋** — mock 라우트 페이지 첫 진입 latency·외부 호출 제거.
- [ ] **Vercel `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` 값 적용 + GCP referrer/API 활성** — (2026-05-23 적용 완료, 지도 정상 표시 확인됨. 유지 모니터링만)

---

## 1. 화면 인벤토리 audit (2026-05-23)

### Marketing
| ID | 화면 | 상태 | 라우트 |
|----|------|------|--------|
| M01 | Landing (Traveler) | ✅ | `/(public)/` |
| M02 | Landing (Guardian) | ✅ | `/(public)/for-guardians` |
| M03 | About | ✅ | `/(public)/about` |
| M04 | How It Works | ✅ | `/(public)/how-it-works` |
| M05 | Pricing | ✅ | `/(public)/pricing` |
| M06 | FAQ | ❌ | **미구현** |
| M07 | Legal (약관·개인정보) | ❌ | **미구현** (`/legal/terms`, `/legal/privacy` 없음) |

### Auth
| ID | 화면 | 상태 | 라우트 |
|----|------|------|--------|
| A01 | Login | ✅ | `/(public)/login`, `/login/guardian` |
| A02 | Signup | ✅ | `/(public)/signup` |
| A03 | Verify OTP | 🟡 | 별도 화면 없음 — OAuth/매직링크로 대체된 것으로 추정, 확인 필요 |
| A04 | Onboarding | ✅ | `/(public)/onboarding`, `/guardian/onboarding` |

### Traveler
| ID | 화면 | 상태 | 라우트 |
|----|------|------|--------|
| T01 | Explore Feed | ✅ | `/(public)/explore`, `/explore/[region]`, `/explore/routes` |
| T02 | Guardian Profile | ✅ | `/(public)/guardians/[guardianId]` |
| T03 | Sample Route Preview | ✅ | `/(public)/routes/[routeId]` (preview 모드) |
| T04 | Custom Request Form | ✅ | `/(public)/request/new` |
| T05 | Request Status | ✅ | `/mypage/requests/[id]` |
| T06 | Checkout | ✅ | `/(public)/checkout`, `/book`, `/book/success` |
| T07 | My Orders | 🟡 | `/mypage/requests` (orders와 requests 통합 여부 확인 필요) |
| T08 | Order Detail | ✅ | `/mypage/requests/[id]` |
| T09 | My Routes | ✅ | `/mypage/routes`, `/(authed)/routes` |
| **T10** | **Route View (Timeline)** | ✅ | `/(public)/routes/[routeId]` — **이번 세션 집중 완성** |
| T11 | Revision Request (traveler) | 🟡 | guardian측 revision은 존재(`/guardian/orders/[id]/revision`), traveler 발의 화면 확인 필요 |
| T12 | Map Toggle | ✅ | T10에 통합 (타임라인 ↔ 지도 + 도보 폴리라인) |
| T13 | Messages Inbox | ✅ | `/mypage/messages`, `/traveler/messages` |
| T14 | Messages Thread | ✅ | 메시지 컴포넌트 통합 |
| T15 | Review Write | 🟡 | 리뷰 **표시** 컴포넌트는 있음, **작성 폼** 미확인 |
| T16 | Profile | ✅ | `/mypage/profile`, `/traveler/account` |
| T17 | Settings | 🟡 | guardian settings만 존재, **traveler settings 미확인** |

### Guardian
| ID | 화면 | 상태 | 라우트 |
|----|------|------|--------|
| G01 | Application | ✅ | `/(public)/guardians/apply` |
| G02 | Pending | 🟡 | onboarding에 통합 추정, 별도 pending 화면 확인 필요 |
| G03 | Dashboard | ✅ | `/guardian/dashboard` |
| G04 | Profile Edit | ✅ | `/guardian/profile/edit`, `/mypage/guardian/profile/edit` |
| G05 | My Routes | ✅ | `/guardian/routes`, `/guardian/posts` |
| G06 | Create Route | ✅ | `/guardian/routes/new`, `/mypage/guardian/posts/new` — **이번 세션 에디터 개선** |
| G07 | Edit Route | ✅ | `/guardian/posts/[postId]/edit` — **이번 세션 에디터 개선** |
| G08 | Received Orders | ✅ | `/guardian/orders` |
| G09 | Order Workspace | ✅ | `/guardian/orders/[id]` |
| G10 | Earnings | ✅ | `/guardian/earnings`, `/mypage/guardian/points` |
| G11 | Messages | ✅ | `/mypage/guardian/messages` |
| G12 | Help Center `[L]` | ❌ | Phase 2 (의도된 미구현) |

### Admin
| ID | 화면 | 상태 | 라우트 |
|----|------|------|--------|
| AD01 | Dashboard | ✅ | `/admin/dashboard` |
| AD02 | Applications | ✅ | `/admin/guardians` |
| AD03 | Application Detail | 🟡 | `/admin/guardians/[guardianId]/media` (detail 전체 범위 확인 필요) |
| AD04 | Editor Reviews | ✅ | `/admin/reviews`, `/admin/posts` |
| AD05 | Review Workspace | 🟡 | `/admin/posts` 통합 여부 확인 필요 |
| AD06~09 | Disputes/Reports/Users `[L]` | 🟡 | `/admin/users` 존재, disputes/reports는 Phase 2 |

**audit 요약:** P(프로덕션 MVP) 화면 대부분 라우트 존재. **확실한 미구현(❌): M06 FAQ, M07 Legal.** 나머지 🟡는 기능 완성도·통합 여부 확인 필요.

---

## 2. 미구현 화면 (신규 개발 필요)

- [x] **M06 FAQ** `/faq` — ✅ 2026-05-23 완성. ko/en 데이터셋 아코디언 + footer 링크. (`faq-content.tsx`)
- [x] **M07 Legal** `/legal/terms`, `/legal/privacy` — ✅ 2026-05-23 완성. 구조화 초안 + "법무 검토 전 초안" 배너. **법무 확정본으로 교체 필요(콘텐츠만).**
- [x] **T15 Review Write** — ✅ 2026-05-23 완성. `/mypage/requests/[id]`에 별점+코멘트+익명 폼, delivered/completed 예약에서만 노출. 서버 액션 + 중복 작성 방지. RLS 정책이 booking 소유/상태 강제.
- [x] **T17 Traveler Settings** — ✅ 2026-05-23 완성. `/mypage/settings` 허브 (계정·언어·알림·저장항목·약관 카드) + 좌측 nav에 설정 항목 추가. 로그아웃은 헤더 계정 메뉴가 전역 처리.

> **섹션 2 완료 (2026-05-23):** 확실한 미구현 4건(FAQ·Legal·Review Write·Traveler Settings) 모두 구현. 다음은 섹션 4(검증) 또는 섹션 3(🟡 완성도 점검).

## 3. 검증 필요 (🟡) — 2026-05-23 audit 완료

- [x] **A03 Verify OTP** — ✅ 매직링크 OTP(`signInWithOtp` + `/auth/callback`) + Google OAuth. 코드 입력 화면 불필요(링크 방식). 완결.
- [x] **T07 My Orders** — ✅ `/mypage/requests`로 통합(bookings + match requests). 별도 orders 화면 없음 = 의도된 통합.
- [x] **T11 Traveler Revision Request** — ✅ 2026-05-23 처리. dead 버튼이던 "수정 요청"은 **숨김**(revision 전체 기능은 별도 라운드), "저장"은 **내 루트 북마크**로 배선(`traveler_saved_routes` 신규 테이블 + 토글 액션 + `/mypage/routes` 저장 섹션). UUID 루트만 저장 가능.
- [x] **G01 Guardian Application** — ✅ 2026-05-23 구현. 가짜 제출 제거 → 실제 `guardian_applications` 영속화. 결정 반영: 로그인 필수(미로그인 시 `/login?next=/guardians/apply` 유도), 문서 업로드는 Phase 2(텍스트 필드만), 전용 상태 화면 추가. 신청자 식별 컬럼(real_name/display_name/contact_email) 추가. zod 검증 + user_id unique 중복 방지.
- [x] **G02 Guardian Pending** — ✅ `GuardianApplicationStatus` 컴포넌트. apply 재방문 시 pending/approved/rejected/needs_revision 상태·검토 의견 표시.
- [x] **AD03 Admin 신청 리뷰** — ✅ 2026-05-23 구현. `/admin/guardians`에 검토 큐 추가(real-session admin 게이트 + service-role 조회). 승인/반려/보완요청 액션(`/api/admin/guardian-applications/[id]/review`, status·reviewer_id·review_note·reviewed_at). **승인 시 guardian_profiles 브리지**(user_id+display_name+approval_status=approved) + users.app_role=guardian 즉시 승격(admin/super_admin 강등 방지) → OAuth sync 로직과 정합. funnel 이제 end-to-end 작동.
- [x] **G01 Phase 2 (문서 업로드)** — ✅ 2026-05-23. 비공개 버킷 `guardian-docs`(10MB, pdf/jpg/png/webp) + service-role 업로드(클라 직접 접근 0). 폼에 선택 파일 입력, residence_proof 경로 저장. admin은 단기 서명 URL(`/api/admin/guardian-applications/[id]/document`)로 열람.
- [x] **G01 Phase 2 (sample_route)** — ✅ 2026-05-23. 지원자는 가디언 권한 전이라 정식 빌더 대신 경량 "샘플 하루 코스" 작성기(제목·지역·스팟 1~12개, jsonb 저장). admin 검토 큐에 코스 렌더. 선택 항목.
- [ ] **G01 잔여** — 승인 시 생성되는 guardian_profiles는 최소 필드(display_name)만 — 가디언 온보딩에서 나머지 보강.
- [ ] **AD05 콘텐츠 모더레이션** — ✅ 작동(`admin-content-table` approve/reject/hide 배선).

### T11 후속 (별도 라운드)
- [ ] 여행자 수정 요청(revision) 전체 기능 — booking.status=revision_requested 전환 + 메모 + 횟수 제한 UX. (가디언측 `/guardian/orders/[id]/revision`은 존재)

---

## 4. 이번 세션(2026-05-22~23) 잔여 검증 — 2026-05-23 audit

> **핵심 발견:** 운영 DB에 `routes`·`route_spots` **데이터 0건**. 모든 루트 표시가 현재 mock 기반.
> 아래 런타임 항목들은 스키마·코드·트리거 정의까지 검증 완료됐으나, **가디언이 실제로 루트를 게시하기 전까지는 실행되지 않음**. 첫 실데이터 게시 시점에 함께 스모크 필요.

- [x] **`spot_images` admin 경로** — ✅ admin/spots GET이 쓰는 컬럼 셋(`district`/`naver_data`/`image_strategy`/`primary_image_url` + `spot_images` 테이블) 운영 존재 확인, SELECT 에러 없음. images API insert 컬럼도 전부 존재.
- [x] **신규 RLS 정책** — ✅ `get_advisors` 클린(경고는 `auth_leaked_password_protection` 1건만). 모든 운영 호출은 service role 경유.
- [x] **트리거/컬럼/함수 설치** — ✅ `directions_meta` 컬럼, `trg_route_spots_invalidate_directions` 트리거, 함수 정의 모두 운영 확인.
- [ ] **🔸 실데이터 스모크 (route 0건이라 미실행)** — 가디언이 첫 루트 게시 시 한 번에 확인:
  - `routes.directions_meta` 자동 채움 + "✓ 도보 경로도 함께 저장됨" 토스트
  - `route_spots` 변경 → `directions_meta=null` 트리거 작동
  - 저장(북마크) 토글 + `/mypage/routes` 저장 섹션 표시
- [ ] **`/api/health/routing`** — admin 세션 HTTP 호출 필요(코드·키 검증됨, cache_likely_hot 실측만 남음).

### ⚠️ 별도 발견: 운영 데이터 시딩
- [ ] 운영 DB `routes`/`route_spots`/`spot_catalog` 데이터 0건 — 데모/실서비스 전 시드 전략 필요. (`pnpm seed:sample` 등 스크립트 존재, 운영 적용 여부 결정 필요)

---

## 5. 알려진 기술 부채 / 개선 후보- [ ] `OSRM_BASE_URL` 자체 인스턴스 도입 (현재 공개 데모 서버 — 운영 불안정). `docker run osrm/osrm-backend` 가이드는 `env.example`에 기록됨.
- [ ] mock directions JSON 자동 생성 — CI 단계에 통합 (현재 수동 스크립트)
- [ ] `spot_catalog.lat/lng` admin 변경 시 directions 무효화 — 현재 `route_spots` 트리거 범위 밖. `/api/admin/routes/[id]/refresh-directions`로 수동 갱신만 가능
- [ ] 미리보기 카드(`RouteDayPreview`)와 사용자 페이지 spot 카드 디자인 통일성 한 단계 더
- [ ] `<img>` → `next/image` 전환 (미리보기 썸네일 등) + `remotePatterns` 정비
- [x] **이번 세션 정책 perf 최적화** — ✅ 2026-05-23. 세션 추가 RLS 정책의 `auth.uid()` → `(select auth.uid())` (auth_rls_initplan), content_posts 중복 SELECT 1개 통합, traveler_saved_routes FK 인덱스.
- [ ] **사전 존재 performance 부채 (대량, 별도 라운드)** — `get_advisors(performance)` 기준 245 WARN + 69 INFO. 대부분 세션 외 사전 존재:
  - `auth_rls_initplan` (77): 기존 정책 다수가 `auth.uid()` bare 사용 — 테이블별 정책 재작성 필요.
  - `multiple_permissive_policies` (168): 같은 테이블·액션에 permissive 정책 다중 — 통합 검토.
  - `unindexed_foreign_keys` (25): FK 커버 인덱스 추가.
  - `unused_index` (44, INFO): DB 데이터 0건이라 현재 무의미 — 트래픽 생긴 뒤 재평가.
  - ⚠️ 대량이고 데이터/트래픽 없을 땐 영향 미미 — 실데이터 투입 후 우선순위화 권장.
- [ ] 보안 lint 잔여: `auth_leaked_password_protection` 1건(대시보드 토글).

---

## 6. 다음 라운드 권장 순서 (제안)

1. **신규 미구현(섹션 2)** — FAQ·Legal은 정적이라 빠름. Review Write·Traveler Settings는 데이터 연결 필요
2. **검증 라운드(섹션 4)** — 이번 세션 배포분 실측 후 fix
3. **🟡 완성도 점검(섹션 3)** — orders/requests·revision 흐름 정리
4. **기술 부채(섹션 5)** — OSRM 자체 인스턴스, next/image 등

---

## 7. UI 품질 / 모바일 사용성 (2026-05-23 audit + 디자인 레퍼런스 영상 반영)

> 목표: UI 퀄리티 향상 + 모바일에서 서비스 가능한 사용성. 영상(마디아 UI/UX 피드백) 원칙:
> 본문 **최소 14px**(≤12px 지양) · 타이틀/본문/서브 **위계 차등** · 그레이박스·과도한 라인 **제거** ·
> **터치 영역 확보** · 핵심요소(프로필 등) **과감히 키우기** · 실서비스 1:1 벤치마킹 · 여백 타이트하게 그룹핑.

### 7-A. 모바일 퀵윈 (저위험·고임팩트)
- [x] **viewport export 추가** — ✅ 2026-05-23. `src/app/layout.tsx`에 `width=device-width, initialScale=1, viewportFit=cover`. 모바일 축소 렌더 해소 + safe-area env() 활성화.
- [x] **하단 고정바 safe-area** — ✅ `route-view-client` 저장바에 `pb-[max(0.75rem,env(safe-area-inset-bottom))]`.
- [x] **터치 타깃 44px** — ✅ 헤더 햄버거·인박스 버튼 `size-9`(36px)→`size-11`(44px).
- [x] **`min-h-screen`→`100dvh`** — ✅ 11개 파일 일관화(모바일 사파리 툴바 점프 방지).

### 7-B. 디자인 결정 필요 (다음 단계)
- [~] **폰트 floor 적용** — 🔄 explore 카드부터 시작(2026-05-23). 본문 10~11px → 12~14px, 이름 15px→base/lg, 헤드라인 line-clamp-2. **나머지 화면은 이 카드를 템플릿으로 순차 적용 예정.**
- [ ] **위계 강화 + 그레이박스 정리** — explore 카드 점선 divider 제거 완료. mypage·admin 카드 등 나머지 적용 필요.
- [ ] **프로필/아바타 확대** — 20px급 → 24~40px+, 좁으면 세로 배치.
- [ ] **모바일 하단 탭바 도입 여부** — 현재 햄버거뿐. 여행 앱 기대치 갭.
- [ ] **admin 테이블 카드형 폴백** — 모바일에서 가로 스크롤만 가능(7~8컬럼).
- [ ] **공유 토큰 `listCardActionButtonClass`(36px) → 44px 승격 검토** — 현재 explore 카드는 로컬 오버라이드. 전 카드 일괄 적용은 RoutePostCard 등 미검토 화면 영향 → 별도 결정.

### explore 카드 리디자인 상세 (템플릿 v1, 2026-05-23)
- 본문 floor: 헤드라인·지역·언어 `text-[11px]`→`text-xs`~`text-[13px]/sm`, 대표글·온라인뱃지 10px→11px.
- 위계: 이름 `text-[15px]`→`text-base/lg font-bold`, 평점 `text-[11px]`→`text-[13px] font-bold` + 별 키움.
- 라인 제거: 신뢰뱃지/평점 줄의 점선 `border-t border-dashed` 제거 → 여백 그룹핑.
- 터치: 1차 CTA 36px→44px(h-11), 보조(비교/저장) 40px(h-10), 필터칩 36px→40px.
- ⚠️ 시각 검증 미실시(로컬 DB env 없음) — 실폰 확인 + 스크린샷 기반 벤치마킹 iteration 권장.
- 기존 린트: `Date.now()` in render(line 475) — 본 작업 무관 사전 존재, 빌드 비차단.

### 7-C. 기능 불완전 (UI와 별개 트랙, 우선순위 높음)
- [ ] **결제(PG) 미연동** — checkout/booking/playbook 전부 시뮬레이션. `payment_status=paid` 경로 없음.
- [ ] **가디언 대시보드 100% mock** — `guardian/dashboard`가 `mockGuardians`(mg14). ⚠️ **승인 CTA(`guardian-application-status.tsx:95`)가 이 mock 화면으로 보냄** → 승인된 실가디언이 가짜 프로필 봄. 정합성 수정 필요.
- [ ] **프리미엄 루트 구매 불가** — `hasPlaybookPremium=isSuperAdmin||isOwner`, 여행자 구매 경로 없음.
- [ ] **2차 stub** — 가디언 대시보드 모듈 버튼 disabled, services 가격 mock, booking-success 서버폴백, explore 카드 북마크/공유 disabled, `/api/bookings` 하드닝.
