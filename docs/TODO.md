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
- [ ] **G02 Guardian Pending** — 🟡 onboarding은 다단계 위저드(`guardian-onboarding-client`). 승인 대기 전용 대기화면은 미발견 — 가드/리다이렉트로 처리되는지 추가 확인 필요. (낮은 우선순위)
- [ ] **AD03/AD05 Admin** — 🟡 콘텐츠 모더레이션(AD04/05)은 `admin-content-table`에 approve/reject/hide 액션 배선됨(작동). 가디언 신청 디렉토리(AD02/03)는 일부 mock — 신청 승인 플로 완성도 확인 필요.

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

## 5. 알려진 기술 부채 / 개선 후보

- [ ] `OSRM_BASE_URL` 자체 인스턴스 도입 (현재 공개 데모 서버 — 운영 불안정). `docker run osrm/osrm-backend` 가이드는 `env.example`에 기록됨.
- [ ] mock directions JSON 자동 생성 — CI 단계에 통합 (현재 수동 스크립트)
- [ ] `spot_catalog.lat/lng` admin 변경 시 directions 무효화 — 현재 `route_spots` 트리거 범위 밖. `/api/admin/routes/[id]/refresh-directions`로 수동 갱신만 가능
- [ ] 미리보기 카드(`RouteDayPreview`)와 사용자 페이지 spot 카드 디자인 통일성 한 단계 더
- [ ] `<img>` → `next/image` 전환 (미리보기 썸네일 등) + `remotePatterns` 정비
- [ ] Performance advisors 점검 (이번 세션은 security advisors만 정리)
- [ ] 사전 존재 lint 잔여: 없음 (security 22→1, 남은 1건은 대시보드 설정)

---

## 6. 다음 라운드 권장 순서 (제안)

1. **신규 미구현(섹션 2)** — FAQ·Legal은 정적이라 빠름. Review Write·Traveler Settings는 데이터 연결 필요
2. **검증 라운드(섹션 4)** — 이번 세션 배포분 실측 후 fix
3. **🟡 완성도 점검(섹션 3)** — orders/requests·revision 흐름 정리
4. **기술 부채(섹션 5)** — OSRM 자체 인스턴스, next/image 등
