# 하루루트 결제·공유 정책 (v2026-05)

이 문서는 하루루트의 결제·접근·공유 정책 단일 소스입니다. UI 카피, 서버 access check, DB 스키마 모두 본 문서를 기준으로 합니다.

> **2026-05-27 기본 모델 전환**: `NEXT_PUBLIC_ENABLE_PAID_ROUTE_LOCK` 기본값 `false` — 공개 루트는 무료 전체 열람·무제한 공유. 수익은 **고마움 표현하기**(선택 결제, 플랫폼 수수료 10%)로 전환. 레거시 990/패스 잠금은 플래그 `true` 시 §1~3 적용.

---

## 1. 결제 정책 (구매)

### 1.1 단건 (Single)

- **가격**: ₩990
- **권한**: 결제 시점에 열람 중이던 **그 루트** 1건에 대해 **90일간 무제한 열람**.
- **만료**: 결제 후 90일. 만료 후 동일 루트를 보려면 재결제 필요.
- **결제자 = 오너**: 그 grant의 owner_user_id.

### 1.2 3건 패키지 (Trio)

- **가격**: ₩2,500
- **권한**: 임의의 서로 다른 루트 **3건**을 각 90일 무제한 열람.
- **잔여 티켓 모델**: `tickets_total: 3`, `tickets_used: N`. 새 루트 진입 시 티켓 1장 소모하여 그 루트에 대해 90일 grant를 발급.
- **만료 정책**: 티켓 자체의 유효기간은 별도(예: 구매 후 12개월). 소모된 시점부터 해당 루트는 90일 카운트.

### 1.3 5건 패키지 (Penta)

- 가격 ₩3,600 / 5건. 그 외 규칙은 Trio와 동일.

### 1.4 결제 후 상태

- 결제 성공 → `RouteAccessGrant` 1건 생성: `{ route_id, owner_user_id, expires_at = now() + 90d, source = "single" | "trio" | "penta" }`.
- 본인은 오너 권한으로 만료 전까지 무제한 열람.

---

## 2. 접근 정책 (열람)

매 라우트 진입 시 서버에서 다음 순서로 판정:

1. **본인 grant 존재 + 미만료** → 통과 (`reason = "owner"`).
2. **공유 초대(받은) 활성** → 통과 (`reason = "shared-invite"`, sharedByUserId 제공).
3. **잔여 티켓 보유 (Trio/Penta)**:
   - 클라이언트에 "열람권 사용해서 보겠어요?" 컨펌 다이얼로그를 우선 노출.
   - 사용자 동의 시 티켓 1장 소모 → 그 루트에 대해 90일 grant 생성 후 통과.
   - 거절 시: 결제 전 프리뷰로 표시.
4. **티켓 소진 (Trio/Penta total 만큼 사용)**:
   - "보유 열람권을 모두 사용했어요" + 재결제 CTA 다이얼로그.
5. **비식별 진입 (비로그인 또는 비식별 share URL)**:
   - 무조건 결제 전 프리뷰로 리다이렉트.
6. **그 외**: 결제 전 프리뷰.

### 비식별 vs 식별

- **식별**: 로그인 세션 ID. 공유 초대 매핑은 `granted_to_user_id`(필수)로만 발급되므로, 공유받은 사용자가 로그인 상태여야 자동 열람.
- **비식별**: 비로그인, 또는 URL 파라미터에 share token이 있어도 그 token의 매핑된 user_id가 다른 사람인 경우 → 비식별로 간주, 강제 paywall.

---

## 3. 공유 정책

### 3.1 오너 권한

- 그 grant의 `owner_user_id`인 사용자만 공유 초대를 발급할 수 있음.

### 3.2 발급 한도

- 그 grant당 **최대 2명**까지 무료 초대.
- 초대받은 사람은 **식별 가능한 회원(로그인)** 이어야 함 — 닉네임 검색 또는 "친구 목록"에서 선택하는 UX.

### 3.3 초대 유효기간

- 초대받은 사람의 활성 기간은 오너의 grant 만료일과 동일(즉, 오너 90일 윈도우 종료 시 초대도 종료).

### 3.4 비식별 공유 시도

- 오너가 "링크 복사" 등으로 비식별 URL을 그대로 공유 → 받는 사람은 식별 매핑이 없으므로 강제 paywall.
- 공유 시트에서는 "이 링크는 친구가 결제해야 볼 수 있어요" 안내를 표시.

### 3.5 어뷰징 방지

- 초대받은 사람을 취소했다가 다시 다른 사람으로 교체 시: 최근 30일 회수 횟수 1회 제한(MVP). 이후 grant당 누적 5회 회수까지 허용.
- 같은 IP/디바이스가 단기간에 여러 무료 초대를 받는 경우 운영 알림.

### 3.6 UI 노출

- 공유받은 사람이 그 루트 진입 시 **상단에 SharedByBanner**: "○○님이 무료로 공유해 줬어요" — 오너 이름·아바타·연 짧은 메시지.
- 오너 본인 화면에는 SharedByBanner를 띄우지 않음.

---

## 4. 다른 유료회원의 시청

| 사용자 상태 | 시청 가능? | 비고 |
|---|---|---|
| 본인 grant 있음 | 예 | reason="owner" |
| 공유 초대 받음 | 예 | reason="shared-invite", banner 노출 |
| 단건(990 single) 보유자, **다른** 루트 진입 | 아니오 | 별도 결제 필요 |
| Trio/Penta 잔여 티켓 보유 | 컨펌 후 예 | 티켓 1장 소모, 90일 grant 생성 |
| Trio/Penta 소진 | 아니오 | 재결제 다이얼로그 |
| 비로그인 / 비식별 share URL | 아니오 | 강제 paywall |

---

## 5. 데이터 모델 (제안)

```sql
-- 사용자가 보유한 권한 단위
create table route_access_grants (
  id uuid primary key default gen_random_uuid(),
  route_id text not null,
  owner_user_id uuid not null references auth.users(id),
  source text not null check (source in ('single','trio','penta','admin-comp')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (route_id, owner_user_id)
);

-- Trio/Penta 패키지 진입 — 잔여 티켓 추적
create table route_ticket_packs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  pack_size int not null check (pack_size in (3,5)),
  tickets_used int not null default 0,
  expires_at timestamptz not null, -- 패키지 자체 유효기간(예: 12개월)
  created_at timestamptz not null default now()
);

-- 공유 초대
create table route_share_invites (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references route_access_grants(id) on delete cascade,
  granted_by_user_id uuid not null references auth.users(id),
  granted_to_user_id uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (grant_id, granted_to_user_id) -- 같은 사람에게 중복 발급 금지
);

-- 초대 한도 enforcement
-- application-level: grant_id 당 status='active' count <= 2
```

RLS:

- `route_access_grants`: owner 본인만 read/write.
- `route_share_invites`: granted_by_user_id 본인 + granted_to_user_id 본인만 read.

---

## 7. 무료 확산 + 고마움 결제 (v2026-05-27, 기본 ON)

### Feature flags

- `NEXT_PUBLIC_ENABLE_PAID_ROUTE_LOCK` — `false`(기본): §1~3 유료 잠금 비활성, 공개 `status=public` 루트 전체 무료 열람.
- `NEXT_PUBLIC_ENABLE_THANKS_PAYMENT` — `true`(기본): 「고마움 표현하기」 UI·`thanks_payments` insert.

### 열람

- 공개 루트: 비로그인·공유 유입 포함 스팟·지도·동선 전체 무료.
- 예외: `private` / `draft` / `deprecated` / `under_review` / 삭제·숨김.

### 공유

- 공개 루트: 횟수 제한 없음, canonical URL 즉시 공유(Web Share / 복사).
- 권한 재확인은 최대 2초, 실패해도 공개 루트면 공유 허용.

### 고마움 결제

- 접근권 구매가 아님 — 결제 없이도 루트 이용 가능.
- 금액 프리셋 ₩1,000 / 3,000 / 5,000 / 10,000, 직접 입력 ₩1,000~100,000.
- 플랫폼 수수료 10% (`platform_fee_amount`), 나머지 `harui_amount`.
- MVP: PG 미연동(`payment_provider=demo`), 로그인 사용자만.

### DB

- `thanks_payments` — `supabase/migrations/20260528000001_thanks_payments.sql`

---

## 6. 마이그레이션 / 롤아웃

- Phase 3A (현재): 정책 문서, 카피, mock access resolver, UI 스캐폴딩.
- Phase 3B: DB 스키마 + 서버 액션(buy/share/revoke/consume-ticket).
- Phase 3C: 실제 PG 연동(Toss/Kakao) 990 / 2500 / 3600.
- Phase 3D: 운영 대시보드(grant 조회/회수/comp), 어뷰징 감시.
