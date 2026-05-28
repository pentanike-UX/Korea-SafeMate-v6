# 고마움 표현하기 — 플로우 케이스 정의

> 구현 브랜치: `feat/free-route-thanks-preview` (main 머지 전 Preview 전용)

## 0. 기본 전제

- 하루루트 열람·공유: **무료·무제한**
- 고마움 표현하기: **선택**, 미결제 시 이용 제한 없음
- 결제 = 콘텐츠 구매가 아닌 **하루이에게 마음 전달**
- 플랫폼 수수료 **10%**, 하루이 전달 **90%**

## 1. MVP 구현 상태 (Preview)

| 케이스 | 상태 |
|--------|------|
| Case 1 홈/추천 진입 → 무료 열람 → 고마움 | ✅ 상·하단 CTA |
| Case 2 공유 링크 진입 → 무료 → 재공유 | ✅ |
| Case 2 비로그인 고마움 → 로그인 → `?intent=thanks` 복귀 | ✅ |
| Case 3 루트 마지막 하단 CTA (메인) | ✅ footer 카드 + 공유 |
| Case 4 공유 완료 후 고마움 유도 | ✅ followup sheet |
| 루트 닫기 시 고마움 다이얼로그 | ✅ `RouteExitThanksDialog` |
| 시드 포스트 → 하루루트 배너 연결 | ✅ `resolveRelatedRouteId` + `pnpm seed:sample --apply` sync |
| 배너 무료 정책 UI | ✅ `RelatedRouteBanner` |
| 포스트 관리 하루루트 링크 | ✅ `guardian-posts-management` |
| Case 5 저장 완료 후 고마움 유도 | ✅ followup sheet |
| Case 6 후기 작성 후 고마움 | ⏳ Phase 3 |
| Case 7 프로필 단독 고마움 | ⏳ Phase 3 |
| Case 8 반복 방문·재결제 문구 | ✅ hasPriorThanks |
| 본인 루트 고마움 차단 | ✅ |
| 중복 결제 10초 방지 | ✅ |
| 비회원 결제 | ❌ MVP 제외 |
| route_stats / harui_stats | ⏳ Phase 3 |
| 관리자 결제 내역 | ⏳ Phase 3 |

## 2. 로그인 복귀

```
고마움 클릭 → /login?next=/routes/{id}?intent=thanks
→ 로그인 → 동일 루트 → 고마움 모달 자동 오픈
```

## 3. Preview 확인 URL

- Base: https://korea-safe-mate-v6-git-feat-free-5f1f4b-pentanike-uxs-projects.vercel.app
- Mock: `/ko/routes/mock`
- PR: https://github.com/pentanike-UX/Korea-SafeMate-v6/pull/3

## 4. Feature flags

- `NEXT_PUBLIC_ENABLE_PAID_ROUTE_LOCK` — default `false`
- `NEXT_PUBLIC_ENABLE_THANKS_PAYMENT` — default `true`

상세 정책: [payment-and-share-policy.md](./payment-and-share-policy.md) §7
