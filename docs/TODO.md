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
- [ ] **T17 Traveler Settings** — 알림·언어·계정 설정. (guardian settings 패턴 재사용 가능)

## 3. 검증 필요 (🟡 — 코드 존재하나 완성도 미확인)

- [ ] A03 Verify OTP — OAuth/매직링크로 대체됐는지, OTP 흐름이 실제 필요한지 확인
- [ ] T07 My Orders vs T05/T08 requests — orders/requests 개념 통합 상태 정리
- [ ] T11 Traveler Revision Request — 여행자가 수정 요청 발의하는 진입점 존재 여부
- [ ] G02 Guardian Pending — 승인 대기 상태 전용 화면 필요 여부
- [ ] AD03/AD05 Admin 상세·워크스페이스 — 리뷰 워크플로 완성도

---

## 4. 이번 세션(2026-05-22~23) 잔여 검증 (코드는 배포됨)

- [ ] 가디언 게시 → `routes.directions_meta` 자동 채움 + "✓ 도보 경로도 함께 저장됨" 토스트 노출 실측
- [ ] `route_spots` 변경 → `directions_meta=null` 트리거 작동 실측
- [ ] `/api/health/routing` (admin 세션) 호출 → `cache_likely_hot` 측정
- [ ] `spot_images` 적용 후 `/admin/spots/*` 페이지 정상 작동
- [ ] 신규 RLS 정책 12개 — 사용자 클라이언트 직접 접근 경로(있다면) 정상 동작

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
