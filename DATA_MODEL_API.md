<!-- markdownlint-disable-file MD013 MD022 MD028 MD032 MD036 MD031 MD040 MD058 MD024 -->
# Korea Safe Mate — Data Model & API
## 4단 · 데이터 모델, RLS, Zod, API 구조 · v1.0

> 전제 문서: [Foundation](./FOUNDATION.md) · [IA](./IA_SCREEN_INVENTORY.md)
> 3A~3C 화면 스펙에서 사용된 모든 타입의 실제 Supabase 구현을 정의한다.
>
> **이 문서 착수 전 체크:**
> - Foundation 섹션 10의 레포 스캔 + 갭 리포트가 완료됐는가?
> - 기존 레포(구 v3)의 테이블 목록과 본 문서를 대조해 충돌 여부를 먼저 파악할 것.
> - 기존 테이블 DROP 금지 (Foundation 섹션 5.3). 신규 마이그레이션으로 추가·보강만.

> **저장소 메모 (이 워크스페이스):** API Route Handlers는 **`src/app/api/`** 이다. Zod·검증 모듈은 **`src/lib/validation/`** 등으로 두는 것을 권장한다(본문 `lib/`는 `src/lib/`에 대응). 타입은 **`src/types/`** 또는 프로젝트 관례에 맞춘다. **이미 `supabase/migrations/`에 `202602*`, `202603*` 등이 존재**하므로, 본문 예시 파일명 `20240001_*`는 **충돌 방지를 위해 실제 적용 시 더 늦은 타임스탬프로 조정**한다. `spot_catalog` **위치 인덱스**는 earthdistance 확장 확인 전 §2.6에서 **생성하지 않는다**(Phase 2 주석). `bookings`의 **`status` 전이**는 **service_role + API Route Handler 전용**으로 두고, RLS는 소유권·비-status 갱신만 단순화한다(§2.9).

---

## 0. 이 문서의 작업 범위

### 이 문서에서 정의하는 것
1. **전체 테이블 스키마** — 컬럼·타입·제약
2. **RLS 정책** — 테이블별 SELECT / INSERT / UPDATE / DELETE
3. **인덱스** — 성능 핵심 인덱스
4. **마이그레이션 파일 구조** — 파일명 규칙·순서
5. **Zod 스키마** — 외부 입력 및 LLM 출력 검증
6. **Supabase Edge Function** — 비동기 루트 생성 작업자
7. **API Route 구조** — Next.js Route Handlers 목록
8. **Mock 데이터 시드** — 목업 단계 초기 데이터

### 이 문서에서 정의하지 않는 것
- Stripe 상세 결제 플로우 (목업 단계 mock으로 대체)
- 한국관광공사 Tour API / Naver Maps 연동 상세 (별도 통합 문서에서)
- Push 알림 인프라 (Phase 2)

---

## 1. 엔티티 관계 개요

```text
auth.users (Supabase 기본)
    │
    ├── users (1:1) — public.users (앱 계정 축)
    │       └── user_profiles (1:1) — 표시·서비스 프로필
    │               ├── traveler_profiles (0..1) — 트래블러 전용
    │               └── guardian_profiles (0..1) — 가디언 전용
    │                       └── guardian_applications (0..1) — 신청 심사
    │
    ├── routes (N) — 가디언 소유 루트
    │       └── route_spots (N) — 루트 내 스팟 (순서)
    │               └── spot_catalog (M:1) — 검증된 스팟 마스터
    │
    ├── bookings (N) — 맞춤 의뢰·매칭(기존 bookings + v6 확장 컬럼)
    │       ├── orders (1:1) — 결제
    │       ├── route_generation_jobs (1:1) — 비동기 생성 작업
    │       └── message_threads (1:1) — 채팅 스레드
    │               └── messages (N)
    │
    └── traveler_reviews (N) — 의뢰 완료 후 트래블러 리뷰
```

---

## 2. 테이블 스키마 (전체)

### 2.1 users
`auth.users`와 1:1로 연결되는 **`public.users`** (기존 v3 스키마). v6 필드는 **ALTER**로만 추가한다. 이미 있는 컬럼은 변경하지 않는다.

```sql
-- supabase/migrations/20260401000001_alter_users_v6.sql
alter table public.users
  add column if not exists onboarded boolean not null default false,
  add column if not exists is_first_visit boolean default true;
```

**RLS:** 기존 `users` RLS(`20260325200000_*`) 유지. 공통 표시 정보는 `user_profiles`를 사용한다.

---

### 2.2 user_profiles
서비스 프로필(표시명·로케일 등). v6에서 **`preferred_lang`** 을 신규로 둔다. 기존 **`locale`** 컬럼은 유지하며, 값 동기화는 별도 데이터 마이그레이션에서 검토한다.

```sql
-- supabase/migrations/20260401000002_alter_user_profiles_v6.sql
alter table public.user_profiles
  add column if not exists preferred_lang text not null default 'en'
    check (preferred_lang in ('ko','en','th','vi','id','fil'));
```

**RLS:** 기존 `user_profiles` RLS 유지.

---

### 2.3 traveler_profiles
트래블러 전용 행(기존 v3: `user_id` PK). v6 알림 플래그 **ALTER**로 추가.

```sql
-- supabase/migrations/20260401000003_alter_traveler_profiles_v6.sql
alter table public.traveler_profiles
  add column if not exists notification_email boolean not null default true,
  add column if not exists notification_push boolean not null default true;
```

**RLS:** `20260401000100_rls_baseline_traveler_profiles.sql` — `user_id = auth.uid()` 본인만 (SELECT/INSERT/UPDATE).

---

### 2.4 guardian_profiles
가디언 워크스페이스(기존 v3: `user_id` PK, `approval_status`, `profile_status` 등). v6에서 파운딩·정산·**`is_public`** 을 **ALTER**로 추가한다. **`matching_enabled`** 와 **`is_public`** 은 용도가 다르므로 공존한다. v6에서 “공개·매칭 가능” 판별은 예: `approval_status = 'approved' and profile_status <> 'suspended'` 조합으로 처리한다. **공개 SELECT RLS**(`00101`)은 `is_public = true` 및 `under_review` 비노출 등 별도 규칙을 따르며, **`matching_enabled`** 는 매칭 알고리즘 전용으로 공개 SELECT 와 별개다.

```sql
-- supabase/migrations/20260401000004_alter_guardian_profiles_v6.sql
alter table public.guardian_profiles
  add column if not exists is_founding_member boolean not null default false,
  add column if not exists founding_commission_expires_at timestamptz,
  add column if not exists stripe_account_id text,
  add column if not exists payout_schedule text default 'monthly',
  add column if not exists is_public boolean not null default false;
```

**RLS:** `20260401000101_rls_baseline_guardian_profiles.sql` — `approval_status = 'approved'`·`profile_status`·`is_public` 조건의 공개 읽기 + 본인 전체 + `public.users.app_role = 'admin'` 존재 여부로 admin.

---

### 2.5 guardian_applications
신청 심사 테이블.

```sql
-- supabase/migrations/20260401000007_create_guardian_applications.sql
create table guardian_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references users(id) on delete cascade,

  -- 신청서 내용
  motivation     text not null,          -- 지원 동기
  languages      text[] not null,
  sample_route   jsonb,                  -- 임시 샘플 루트 (심사용)
  residence_proof text,                  -- Storage URL

  -- 심사 결과
  status         text not null default 'pending'
                 check (status in ('pending','approved','rejected','needs_revision')),
  reviewer_id    uuid references users(id),
  review_note    text,
  reviewed_at    timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger guardian_applications_updated_at
  before update on guardian_applications
  for each row execute function update_updated_at_column();
```

**RLS:**

```sql
alter table guardian_applications enable row level security;

create policy "applications_own"
  on guardian_applications for select
  using (user_id = auth.uid());

create policy "applications_insert_own"
  on guardian_applications for insert
  with check (user_id = auth.uid());

create policy "applications_admin"
  on guardian_applications for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
```

---

### 2.6 spot_catalog
LLM 할루시네이션 방지용 검증된 스팟 마스터.
Foundation 섹션 2.2b의 핵심 해결책.

```sql
-- supabase/migrations/20260401000008_create_spot_catalog.sql
create table spot_catalog (
  id              uuid primary key default gen_random_uuid(),

  -- 다국어 이름
  name_ko         text not null,
  name_en         text,
  name_th         text,
  name_vi         text,

  -- 위치
  address_ko      text,
  address_en      text,
  lat             numeric(10,7) not null,
  lng             numeric(10,7) not null,
  region_tags     text[] not null default '{}',
                  -- ['홍대', '마포구', '서울']

  -- 분류
  category        text not null
                  check (category in ('food','cafe','attraction','shopping','nightlife','nature','activity')),
  subcategory     text,

  -- 운영 정보
  avg_cost_krw    int,
  avg_stay_min    int,
  reservation_required boolean default false,
  external_url    text,           -- 예약·정보 링크
  kakaomap_id     text,
  naver_place_id  text,

  -- 이미지
  images          text[] default '{}',

  -- 출처 및 검증
  source          text not null default 'manual'
                  check (source in ('manual','tour_api','naver_api','guardian_submitted')),
  is_verified     boolean not null default false,
  is_active       boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index spot_catalog_category_idx on spot_catalog(category);
create index spot_catalog_region_idx on spot_catalog using gin(region_tags);
-- Phase 2: earthdistance(또는 PostGIS) 확장 활성화 및 운영 승인 후,
--   위치 기반 조회용 인덱스 추가 (예: gist(ll_to_earth(lat, lng)) 또는 geography 컬럼 + GiST).
--   확장 여부 확인 전까지 location 전용 인덱스는 생성하지 않음.
create index spot_catalog_active_idx on spot_catalog(is_active, is_verified);

create trigger spot_catalog_updated_at
  before update on spot_catalog
  for each row execute function update_updated_at_column();
```

**RLS:**

```sql
alter table spot_catalog enable row level security;

-- 검증된 활성 스팟은 모두 읽기 (비로그인 포함)
create policy "spot_catalog_select_public"
  on spot_catalog for select
  using (is_active = true and is_verified = true);

-- Admin: 전체 관리
create policy "spot_catalog_admin"
  on spot_catalog for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
```

---

### 2.7 routes
가디언이 만든 하루 단위 루트. 가디언 식별은 **`guardian_profiles.user_id`** 축을 사용한다.

```sql
-- supabase/migrations/20260401000009_create_routes.sql
create table routes (
  id              uuid primary key default gen_random_uuid(),
  guardian_user_id uuid not null references guardian_profiles(user_id) on delete cascade,

  -- 콘텐츠
  title_ko        text,
  title_en        text,
  title_th        text,
  title_vi        text,

  -- 메타
  region_tags     text[] not null default '{}',
  total_duration_min int,        -- 집계 캐시
  estimated_cost_min_krw int,
  estimated_cost_max_krw int,
  cover_image_url text,

  -- 상태
  status          text not null default 'draft'
                  check (status in ('draft','under_review','public','private','deprecated')),

  -- 타입: 샘플(공개용) vs 맞춤(주문용)
  route_type      text not null default 'sample'
                  check (route_type in ('sample','custom')),

  -- 맞춤 루트인 경우 연결
  order_id        uuid,          -- bookings.id 참조 (순환 참조 방지로 FK 생략 가능)

  -- 통계
  view_count      int not null default 0,
  purchase_count  int not null default 0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index routes_guardian_user_idx on routes(guardian_user_id);
create index routes_status_type_idx on routes(status, route_type);
create index routes_region_idx on routes using gin(region_tags);

create trigger routes_updated_at
  before update on routes
  for each row execute function update_updated_at_column();
```

**RLS:**

```sql
alter table routes enable row level security;

-- 공개 샘플 루트: 모두 읽기
create policy "routes_select_public"
  on routes for select
  using (
    status = 'public'
    and route_type = 'sample'
    and deleted_at is null
  );

-- 가디언 본인 루트: 전체 읽기
create policy "routes_select_own"
  on routes for select
  using (guardian_user_id = auth.uid());

-- 맞춤 루트: 주문한 트래블러도 읽기 (order_id 매칭)
create policy "routes_select_traveler_order"
  on routes for select
  using (
    route_type = 'custom'
    and order_id in (
      select b.id from bookings b
      where b.traveler_user_id = auth.uid()
    )
  );

-- 가디언 본인 CRUD
create policy "routes_guardian_own"
  on routes for all
  using (guardian_user_id = auth.uid());

-- Admin
create policy "routes_admin"
  on routes for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
```

---

### 2.8 route_spots
루트 내 스팟 순서·메타.

```sql
-- supabase/migrations/20260401000010_create_route_spots.sql
create table route_spots (
  id              uuid primary key default gen_random_uuid(),
  route_id        uuid not null references routes(id) on delete cascade,
  spot_id         uuid not null references spot_catalog(id),
  sort_order      int not null,

  -- 가디언 설정값
  stay_min        int not null default 60,
  guardian_note_ko text,
  guardian_note_en text,
  guardian_note_th text,
  guardian_note_vi text,

  -- 이전 스팟으로부터 이동 (이 스팟 기준)
  move_from_prev_method text check (move_from_prev_method in ('walk','subway','taxi')),
  move_from_prev_min    int,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (route_id, sort_order)
);

create index route_spots_route_idx on route_spots(route_id, sort_order);

create trigger route_spots_updated_at
  before update on route_spots
  for each row execute function update_updated_at_column();
```

**RLS:**

```sql
alter table route_spots enable row level security;

-- 공개 루트 스팟 읽기
create policy "route_spots_select_public"
  on route_spots for select
  using (
    route_id in (
      select id from routes
      where status = 'public' and route_type = 'sample' and deleted_at is null
    )
  );

-- 가디언 본인 루트 스팟 전체 관리
create policy "route_spots_guardian_own"
  on route_spots for all
  using (
    route_id in (
      select r.id from routes r
      where r.guardian_user_id = auth.uid()
    )
  );

-- 트래블러: 주문한 맞춤 루트 스팟 읽기
create policy "route_spots_traveler_order"
  on route_spots for select
  using (
    route_id in (
      select r.id from routes r
      join bookings b on b.id = r.order_id
      where b.traveler_user_id = auth.uid()
    )
  );
```

---

### 2.9 bookings
맞춤 루트 의뢰·매칭 핵심 테이블. v3에는 이미 **`public.bookings`** (`traveler_user_id`, `guardian_user_id`, `status` = `booking_status` 등)가 있다. 4단 필드는 **`ALTER`** 로 병합하고, `booking_status` enum 은 **`20260401000005a_alter_booking_status_enum.sql`** 에서 `ALTER TYPE ... ADD VALUE IF NOT EXISTS` 로 확장한 뒤, **`20260401000005b_alter_bookings_v6.sql`** 에서 컬럼을 추가한다(실행 순서: **05a → 05b**).

```sql
-- supabase/migrations/20260401000005b_alter_bookings_v6.sql (발췌)
alter table public.bookings
  add column if not exists tier text
    check (tier is null or tier in ('basic','standard','premium')),
  add column if not exists travel_dates date[],
  add column if not exists interests text[] not null default '{}',
  add column if not exists transport_pref text
    check (transport_pref is null or transport_pref in ('walk','transit','taxi_ok')),
  add column if not exists food_restrictions text[] default '{}',
  add column if not exists communication_lang text default 'en',
  add column if not exists delivery_deadline_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists revision_count int not null default 0,
  add column if not exists max_revisions int not null default 1,
  add column if not exists revision_request_text text,
  add column if not exists revision_requested_at timestamptz;
```

```sql
-- supabase/migrations/20260401000005a_alter_booking_status_enum.sql (발췌; 트랜잭션 외부 실행 전제)
alter type public.booking_status add value if not exists 'in_progress';
alter type public.booking_status add value if not exists 'under_review';
alter type public.booking_status add value if not exists 'delivered';
alter type public.booking_status add value if not exists 'revision_requested';
alter type public.booking_status add value if not exists 'completed';
alter type public.booking_status add value if not exists 'refunded';
```

**RLS:** `20260401000102_rls_baseline_bookings.sql` — 트래블러/가디언 각각 본인 의뢰만(§2.9 정책 참고). `status` 전이는 **service_role + API Route** 전용 원칙 유지.

```sql
alter table bookings enable row level security;

create policy "bookings_select_traveler"
  on bookings for select
  using (traveler_user_id = auth.uid());

create policy "bookings_select_guardian"
  on bookings for select
  using (guardian_user_id = auth.uid());

create policy "bookings_insert_traveler"
  on bookings for insert
  with check (traveler_user_id = auth.uid());

create policy "bookings_update_guardian_owned_row"
  on bookings for update
  using (guardian_user_id = auth.uid())
  with check (guardian_user_id = auth.uid());

create policy "bookings_admin"
  on bookings for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
```

---

### 2.10 orders
결제 레코드. **bookings** 와 1:1. FK 는 **`booking_id` → `bookings.id`**.

```sql
-- supabase/migrations/20260401000011_create_orders.sql
create table orders (
  id                     uuid primary key default gen_random_uuid(),
  booking_id             uuid not null unique references bookings(id) on delete cascade,
  traveler_user_id       uuid not null references users(id) on delete cascade,
  guardian_user_id       uuid not null references users(id) on delete cascade,

  -- 금액 (원단위 × 100, 즉 cents 방식)
  tier                   text not null,
  gross_amount_krw_cents bigint not null,    -- 트래블러 결제 금액
  platform_fee_krw_cents bigint not null,    -- 플랫폼 수수료 (20% 또는 15%)
  guardian_payout_krw_cents bigint not null, -- 가디언 수령 예정액
  commission_rate        numeric(4,3) not null, -- 0.200 또는 0.150

  -- 결제
  payment_status         text not null default 'pending'
                         check (payment_status in ('pending','paid','failed','refunded')),
  payment_provider       text default 'stripe',
  payment_provider_ref   text,           -- Stripe PaymentIntent ID
  paid_at                timestamptz,

  -- 정산
  payout_status          text not null default 'pending'
                         check (payout_status in ('pending','processing','paid','failed')),
  payout_provider_ref    text,           -- Stripe Transfer ID
  paid_out_at            timestamptz,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index orders_traveler_user_idx on orders(traveler_user_id);
create index orders_guardian_user_idx on orders(guardian_user_id);
create index orders_payment_status_idx on orders(payment_status);
create index orders_payout_status_idx on orders(payout_status);

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at_column();
```

**RLS:**

```sql
alter table orders enable row level security;

-- 트래블러: 본인 주문 읽기
create policy "orders_select_traveler"
  on orders for select
  using (traveler_user_id = auth.uid());

-- 가디언: 본인 주문 읽기 (금액 일부 컬럼만 노출 — 컬럼 레벨 보안은 View로 처리)
create policy "orders_select_guardian"
  on orders for select
  using (guardian_user_id = auth.uid());

-- 모든 DML은 서버사이드 전용 (service_role)
-- 클라이언트에서 직접 insert/update/delete 금지
create policy "orders_server_only"
  on orders for insert
  with check (false);  -- 클라이언트 insert 완전 차단

-- Admin
create policy "orders_admin"
  on orders for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
```

---

### 2.11 route_generation_jobs
비동기 루트 생성 작업 큐. Foundation 섹션 2.2d의 핵심 해결책.

```sql
-- supabase/migrations/20260401000012_create_route_generation_jobs.sql
create table route_generation_jobs (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references bookings(id) on delete cascade,
  guardian_user_id uuid not null references guardian_profiles(user_id) on delete cascade,

  -- 작업 설정
  ai_provider     text not null default 'openai'
                  check (ai_provider in ('openai','gemini','grok')),
  prompt_version  text not null default 'v1',

  -- 상태
  status          text not null default 'queued'
                  check (status in ('queued','running','completed','failed','cancelled')),
  attempt_count   int not null default 0,
  max_attempts    int not null default 3,

  -- 결과
  result_route_id uuid references routes(id),
  error_message   text,
  error_code      text,

  -- 타이밍
  started_at      timestamptz,
  completed_at    timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index rg_jobs_status_idx on route_generation_jobs(status);
create index rg_jobs_booking_idx on route_generation_jobs(booking_id);

create trigger rg_jobs_updated_at
  before update on route_generation_jobs
  for each row execute function update_updated_at_column();
```

**RLS:**

```sql
alter table route_generation_jobs enable row level security;

-- 가디언: 본인 작업 읽기 (상태 확인용)
create policy "rg_jobs_guardian"
  on route_generation_jobs for select
  using (guardian_user_id = auth.uid());

-- 모든 DML: service_role 전용
create policy "rg_jobs_server_only"
  on route_generation_jobs for insert
  with check (false);

-- Admin
create policy "rg_jobs_admin"
  on route_generation_jobs for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
```

---

### 2.12 message_threads + messages
트래블러↔가디언 채팅.

```sql
-- supabase/migrations/20260401000013_create_message_threads_messages.sql
create table message_threads (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null unique references bookings(id) on delete cascade,
  traveler_user_id uuid not null references users(id) on delete cascade,
  guardian_user_id uuid not null references users(id) on delete cascade,

  -- 메시지 제한 (티어별)
  max_messages_traveler  int not null default 1,  -- Basic/Standard: 1, Premium: 무제한(-1)
  traveler_message_count int not null default 0,

  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references message_threads(id) on delete cascade,
  sender_user_id uuid not null references users(id),
  sender_role     text not null check (sender_role in ('traveler','guardian','admin')),

  content         text not null,
  content_type    text not null default 'text'
                  check (content_type in ('text','image','route_preview')),

  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index messages_thread_idx on messages(thread_id, created_at);
create index messages_sender_idx on messages(sender_user_id);
```

**RLS:**

```sql
alter table message_threads enable row level security;

create policy "threads_participants"
  on message_threads for select
  using (
    traveler_user_id = auth.uid()
    or guardian_user_id = auth.uid()
  );

alter table messages enable row level security;

create policy "messages_participants"
  on messages for select
  using (
    thread_id in (
      select id from message_threads
      where
        traveler_user_id = auth.uid()
        or guardian_user_id = auth.uid()
    )
  );

create policy "messages_insert_participants"
  on messages for insert
  with check (
    sender_user_id = auth.uid()
    and thread_id in (
      select id from message_threads
      where
        traveler_user_id = auth.uid()
        or guardian_user_id = auth.uid()
    )
  );
```

---

### 2.13 traveler_reviews
거래 완료 후 트래블러가 가디언을 평가한다. v3에는 이미 **`traveler_reviews`** (`booking_id`, `traveler_user_id`, `guardian_user_id`, …)가 있다. v6에서는 **`route_id`**, **`is_anonymous`** 를 `ALTER` 로 추가한다(`20260401000006` + `routes` 생성 후 `20260401000009`에서 FK 연결).

```sql
-- supabase/migrations/20260401000006_alter_traveler_reviews_v6.sql (발췌)
alter table public.traveler_reviews
  add column if not exists route_id uuid,
  add column if not exists is_anonymous boolean not null default false;
-- route_id FK → routes(id) 는 routes 테이블 생성 마이그레이션末尾에서 추가
```

**RLS:** `20260401000103_rls_baseline_reviews.sql` — 공개 읽기 + 본인(traveler_user_id) insert/update.

```sql
alter table traveler_reviews enable row level security;

create policy "traveler_reviews_select_public"
  on traveler_reviews for select
  using (true);

create policy "traveler_reviews_insert_traveler"
  on traveler_reviews for insert
  with check (
    traveler_user_id = auth.uid()
    and booking_id in (
      select id from bookings
      where status in ('delivered', 'completed')
    )
  );

create policy "traveler_reviews_update_own"
  on traveler_reviews for update
  using (
    traveler_user_id = auth.uid()
    and created_at > now() - interval '30 days'
  );

create policy "traveler_reviews_admin"
  on traveler_reviews for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
```

---

### 2.14 공통 유틸리티 함수

```sql
-- supabase/migrations/20260401000007_create_guardian_applications.sql 등에서 정의
-- updated_at 자동 갱신 함수
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 가디언 평균 평점 캐시(예시 — 실제 컬럼명은 guardian_profiles.avg_traveler_rating 등과 정합)
create or replace function public.update_guardian_stats()
returns trigger as $$
begin
  update public.guardian_profiles gp
  set avg_traveler_rating = (
    select coalesce(avg(tr.rating)::numeric(2,1), gp.avg_traveler_rating)
    from public.traveler_reviews tr
    where tr.guardian_user_id = new.guardian_user_id
  )
  where gp.user_id = new.guardian_user_id;
  return new;
end;
$$ language plpgsql;

-- create trigger traveler_reviews_update_guardian_stats
--   after insert or update on public.traveler_reviews
--   for each row execute function public.update_guardian_stats();
```

트리거 활성화 시점: Phase 1 실 리뷰 데이터 수집 시작 후.

---

## 3. 마이그레이션 파일 구조

```text
supabase/migrations/
  (기존) 20260201000000_initial_public_schema.sql … 202603* …

  -- v6 병합·신규 (예시 타임스탬프 20260401*)
  20260401000001_alter_users_v6.sql
  20260401000002_alter_user_profiles_v6.sql
  20260401000003_alter_traveler_profiles_v6.sql
  20260401000004_alter_guardian_profiles_v6.sql
  20260401000005a_alter_booking_status_enum.sql
  20260401000005b_alter_bookings_v6.sql
  20260401000006_alter_traveler_reviews_v6.sql
  20260401000007_create_guardian_applications.sql
  20260401000008_create_spot_catalog.sql
  20260401000009_create_routes.sql
  20260401000010_create_route_spots.sql
  20260401000011_create_orders.sql
  20260401000012_create_route_generation_jobs.sql
  20260401000013_create_message_threads_messages.sql
  20260401000100_rls_baseline_traveler_profiles.sql
  20260401000101_rls_baseline_guardian_profiles.sql
  20260401000102_rls_baseline_bookings.sql
  20260401000103_rls_baseline_reviews.sql

  -- 시드 (개발·목업 전용)
  20240200_seed_spot_catalog.sql
  20240201_seed_mock_guardians.sql
```

### 마이그레이션 규칙
- 파일명: `{timestamp}_{action}_{target}.sql` (타임스탬프는 `YYYYMMDD` + 순서)
- **이 저장소:** 이미 `20260201000000_*` 등이 있으므로 신규 파일은 **그보다 큰 타임스탬프**를 사용한다.
- 각 파일은 **독립적으로 실행 가능**해야 함 (의존성은 FK로만 표현)
- `down` 마이그레이션(롤백)은 목업 단계에서 불필요. 필요 시 별도 `_rollback.sql`

---

## 4. Zod 스키마 정의

모든 외부 입력과 LLM 출력은 Zod로 검증한다.

### 4.1 파일 구조

```text
src/lib/validation/
  schemas/
    profile.ts
    guardian.ts
    route.ts
    request.ts
    order.ts
    review.ts
  llm/
    route-generation-output.ts    ← LLM 응답 전용
  index.ts
```

### 4.2 주요 Zod 스키마

**프로필 업데이트**

```typescript
// src/lib/validation/schemas/profile.ts
import { z } from 'zod'

export const SupportedLocale = z.enum(['ko','en','th','vi','id','fil'])

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(1).max(50).optional(),
  preferred_lang: SupportedLocale.optional(),
  country_code: z.string().length(2).toUpperCase().optional(),
  is_first_visit: z.boolean().optional(),
})

export const CompleteOnboardingSchema = z.object({
  preferred_lang: SupportedLocale,
  country_code: z.string().length(2).toUpperCase(),
  is_first_visit: z.boolean(),
})
```

**맞춤 의뢰 생성**

```typescript
// src/lib/validation/schemas/request.ts
import { z } from 'zod'

export const TierEnum = z.enum(['basic', 'standard', 'premium'])

export const CreateRequestSchema = z.object({
  guardian_user_id: z.string().uuid(),
  tier: TierEnum,
  travel_dates: z.array(z.string().date()).min(1).max(7),
  party_size: z.enum(['1','2','3-4','5+']),
  budget_range: z.enum(['under100k','100-200k','200-300k','over300k']),
  interests: z.array(z.string()).max(10),
  transport_pref: z.enum(['walk','transit','taxi_ok']).optional(),
  avoid_items: z.array(z.string()).max(5).optional(),
  food_restrictions: z.array(z.string()).max(5).optional(),
  special_request: z.string().max(300).optional(),
  communication_lang: z.enum(['ko','en','th','vi','id','fil']),
})

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>
```

**루트 에디터 저장**

```typescript
// src/lib/validation/schemas/route.ts
import { z } from 'zod'

export const EditorSpotSchema = z.object({
  catalog_spot_id: z.string().uuid(),
  sort_order: z.number().int().min(0),
  stay_min: z.number().int().min(5).max(480),
  guardian_note_ko: z.string().max(200).optional(),
  guardian_note_en: z.string().max(200).optional(),
  guardian_note_th: z.string().max(200).optional(),
  guardian_note_vi: z.string().max(200).optional(),
  move_from_prev_method: z.enum(['walk','subway','taxi']).optional(),
  move_from_prev_min: z.number().int().min(1).max(120).optional(),
})

export const SaveRouteSchema = z.object({
  title_ko: z.string().max(50).optional(),
  title_en: z.string().max(50).optional(),
  title_th: z.string().max(50).optional(),
  title_vi: z.string().max(50).optional(),
  region_tags: z.array(z.string()).max(5),
  status: z.enum(['draft','public','private']),
  spots: z.array(EditorSpotSchema).min(0).max(15),
})

export type SaveRouteInput = z.infer<typeof SaveRouteSchema>
```

**LLM 루트 생성 출력 검증 (핵심)**

```typescript
// src/lib/validation/llm/route-generation-output.ts
// Foundation 섹션 2.2b, 2.2c 해결책
import { z } from 'zod'

export const LLMSpotOutputSchema = z.object({
  catalog_spot_id: z.string().uuid(),
  sort_order: z.number().int(),
  stay_min: z.number().int().min(5).max(480),
  guardian_note_en: z.string().max(200),
  move_from_prev_method: z.enum(['walk','subway','taxi']).optional(),
  move_from_prev_min: z.number().int().min(1).max(120).optional(),
})

export const LLMRouteOutputSchema = z.object({
  spots: z.array(LLMSpotOutputSchema).min(3).max(10),
  title_en: z.string().max(50),
  region_tags: z.array(z.string()).max(5),
})

export type LLMRouteOutput = z.infer<typeof LLMRouteOutputSchema>

export function validateLLMOutput(raw: unknown): LLMRouteOutput {
  const result = LLMRouteOutputSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`LLM output validation failed: ${result.error.message}`)
  }
  return result.data
}
```

**리뷰 작성**

```typescript
// src/lib/validation/schemas/review.ts
import { z } from 'zod'

export const CreateReviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  is_anonymous: z.boolean().default(false),
})
```

---

## 5. API Route 구조 (Next.js Route Handlers)

### 5.1 파일 구조

**실경로:** `src/app/api/` (본문 `app/api/`는 동일 의미).

```text
src/app/api/
  auth/
    callback/route.ts          ← Supabase OAuth callback
    profile/route.ts           ← PATCH /api/auth/profile
  guardians/
    route.ts                   ← GET /api/guardians (리스트)
    [id]/route.ts              ← GET /api/guardians/[id]
    [id]/routes/route.ts       ← GET /api/guardians/[id]/routes
  spots/
    search/route.ts            ← GET /api/spots/search?q=&category=
  requests/
    route.ts                   ← POST /api/requests (의뢰 생성)
    [id]/route.ts              ← GET /api/requests/[id]
    [id]/accept/route.ts       ← POST (가디언 수락)
    [id]/reject/route.ts       ← POST (가디언 거절)
    [id]/deliver/route.ts      ← POST (납품 제출)
    [id]/revision/route.ts     ← POST (수정 요청)
  routes/
    route.ts                   ← POST /api/routes (새 루트 생성)
    [id]/route.ts              ← GET, PATCH, DELETE
    [id]/spots/route.ts        ← GET, PUT (스팟 전체 교체)
  orders/
    route.ts                   ← POST /api/orders (주문 생성 + Stripe PI)
    [id]/route.ts              ← GET
  payments/
    webhook/route.ts           ← POST (Stripe webhook)
    mock-complete/route.ts     ← POST (DEMO MODE 전용, 목업 결제 완료)
  jobs/
    route-generation/route.ts  ← POST (Edge Function 트리거)
  messages/
    threads/route.ts           ← GET
    threads/[id]/route.ts      ← GET
    threads/[id]/messages/route.ts ← GET, POST
  reviews/
    route.ts                   ← POST
```

### 5.2 API 작성 원칙

**공통 패턴**

```typescript
// 모든 Route Handler 기본 구조
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const result = await doSomething(supabase, user, parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[POST /api/xxx]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**주요 Route Handler 상세 (요약)**

- `POST /api/requests` — Zod 검증 → `traveler_user_id` / 가디언 active 확인 → `bookings` INSERT → `orders` → 목업 시 paid 처리 등.
- `POST /api/requests/[id]/deliver` — 가디언 권한, 루트 완성도, 상태 전이, Realtime 알림.
- `POST /api/payments/mock-complete` — `process.env.NEXT_PUBLIC_DEMO_MODE === 'true'` 일 때만 허용.

---

## 6. Supabase Edge Function — 비동기 루트 생성

Foundation 섹션 2.2d의 Vercel 타임아웃 해결책.

### 6.1 파일 구조

```text
supabase/functions/
  generate-route/
    index.ts         ← Edge Function 진입점
  _shared/
    llm-router.ts    ← Multi-LLM Provider 추상화
    spot-selector.ts ← spot_catalog 조회 및 필터
    validator.ts     ← LLM 출력 검증 (Zod 공유)
```

### 6.2 Edge Function 흐름 (요약)

1. `job_id`로 `route_generation_jobs` 조회
2. 상태 `running` 업데이트
3. `bookings` 로드
4. `spot_catalog` 후보 조회
5. LLM 프롬프트 구성 (후보 스팟 ID만)
6. LLM 호출 → Zod 검증 → 재시도
7. `routes` + `route_spots` INSERT
8. job 완료 + Realtime Broadcast

### 6.3 LLM 프롬프트 전략

시스템 프롬프트에 **catalog_spot_id만 사용, 임의 이름/ID 금지**, **JSON 스키마만 출력**을 명시한다(IA·Foundation 참조).

```text
You are a Seoul travel route planner.
Given traveler preferences and a list of verified spots,
create a one-day itinerary.

RULES:
1. Only use spot IDs from the provided catalog. NEVER invent spot names or IDs.
2. Select 5-7 spots for a full day.
3. Order spots logically (morning → afternoon → evening).
4. Consider geography (minimize unnecessary travel).
5. Respond ONLY with valid JSON matching the specified schema.
   Do not include any text outside the JSON.

RESPONSE SCHEMA:
{
  "spots": [
    {
      "catalog_spot_id": "<uuid from provided list>",
      "sort_order": 0,
      "stay_min": 60,
      "guardian_note_en": "...",
      "move_from_prev_method": "walk",
      "move_from_prev_min": 10
    }
  ],
  "title_en": "...",
  "region_tags": ["Hongdae", "Mapo-gu"]
}
```

### 6.4 Multi-LLM Failover

```typescript
// src/lib/ai/provider-router.ts (또는 Edge _shared)
const PROVIDER_PRIORITY = [
  process.env.AI_PRIMARY_PROVIDER || 'openai',
  process.env.AI_FALLBACK_1 || 'gemini',
  process.env.AI_FALLBACK_2 || 'grok',
]

export async function callLLM(prompt: string): Promise<string> {
  for (const provider of PROVIDER_PRIORITY) {
    try {
      return await callProvider(provider, prompt)
    } catch (err) {
      console.error(`[LLM] ${provider} failed:`, err)
    }
  }
  throw new Error('All LLM providers failed')
}
```

---

## 7. TypeScript 타입 자동 생성

Supabase CLI로 DB 스키마에서 타입 자동 생성.

```bash
# package.json scripts에 추가 검토
pnpm exec supabase gen types typescript --local > src/types/database.types.ts
```

### 생성 후 사용 패턴

```typescript
// src/types/database.types.ts (자동 생성, 편집 금지)
export type Database = { ... }

// src/types/index.ts (수동 관리 — 편의 타입 정의)
import type { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type TravelerProfile = Database['public']['Tables']['traveler_profiles']['Row']
export type GuardianProfile = Database['public']['Tables']['guardian_profiles']['Row']
// ...
```

---

## 8. Supabase 클라이언트 분리 (서버/클라이언트)

Foundation 섹션 3.2 원칙 구현. 실제 import 경로는 **`@/lib/supabase/*`** (이 저장소 관례)에 맞춘다.

```typescript
// src/lib/supabase/server.ts — 패턴 예시 (cookies()는 Next 버전에 맞게 async 대응)
import { createServerClient as _createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createServerClient() {
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* 프로젝트의 SSR 쿠키 헬퍼 */ } }
  )
}

export function createServiceClient() {
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { /* 서버 전용 */ } }
  )
}
```

---

## 9. Mock 데이터 시드

### 9.1 파일 구조

```text
supabase/seed/
  spot_catalog.sql
  mock_guardians.sql
  mock_routes.sql
  mock_bookings.sql
```

(저장소에 `supabase/seed/` 폴더가 없으면 생성. 기존 시드 전략과 충돌 시 §11에서 병합.)

### 9.2 TypeScript Mock — 목업 UI용

**실경로:** `src/data/mock/` 또는 목표 `src/lib/mock/`. DB Row 타입과 필드명을 맞춘다.

```typescript
// src/lib/mock/index.ts (이행 시)
export { MOCK_GUARDIANS } from './guardians'
// ...
```

### 9.3 스팟 카탈로그 시드 (최소 목록)

```sql
-- supabase/seed/spot_catalog.sql
insert into spot_catalog (name_ko, name_en, lat, lng, category, region_tags, is_verified, source)
values
('홍대 걷고싶은거리', 'Hongdae Walking Street', 37.5563, 126.9238, 'attraction', '{"홍대","마포구","서울"}', true, 'manual'),
('연남동 경의선숲길', 'Yeonnam Forest Road', 37.5631, 126.9253, 'attraction', '{"연남동","마포구","서울"}', true, 'manual'),
('앤트러사이트 홍대', 'Anthracite Hongdae', 37.5518, 126.9239, 'cafe', '{"홍대","마포구","서울"}', true, 'manual'),
('서울숲', 'Seoul Forest', 37.5445, 127.0373, 'nature', '{"성수","성동구","서울"}', true, 'manual'),
('성수 카페거리', 'Seongsu Cafe Street', 37.5443, 127.0558, 'cafe', '{"성수","성동구","서울"}', true, 'manual'),
('명동 쇼핑거리', 'Myeongdong Shopping', 37.5636, 126.9828, 'shopping', '{"명동","중구","서울"}', true, 'manual'),
('남산타워', 'N Seoul Tower', 37.5512, 126.9882, 'attraction', '{"남산","용산구","서울"}', true, 'manual'),
('경복궁', 'Gyeongbokgung Palace', 37.5796, 126.9770, 'attraction', '{"경복궁","종로구","서울"}', true, 'manual'),
('북촌한옥마을', 'Bukchon Hanok Village', 37.5826, 126.9844, 'attraction', '{"북촌","종로구","서울"}', true, 'manual'),
('인사동 쌈지길', 'Insadong Ssamziegil', 37.5742, 126.9857, 'shopping', '{"인사동","종로구","서울"}', true, 'manual');
-- ... 최소 30개까지 채울 것
```

**실행 전:** `spot_catalog` 테이블·RLS·인덱스(PostGIS 등) 존재 여부 확인.

---

## 10. 환경 변수 목록

루트 **`env.example`** 및 Vercel 환경 변수와 동기화한다(실 값은 커밋 금지).

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
OPENAI_API_KEY=
GEMINI_API_KEY=
GROK_API_KEY=
AI_PRIMARY_PROVIDER=openai

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Tour / Naver (추후)
TOUR_API_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# 앱 설정
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_DEMO_MODE=true

# 모니터링 (선택)
SENTRY_DSN=
```

---

## 11. 이 문서를 읽은 뒤 Claude Code가 해야 할 것

**코드 작성 전 3단계 확인 절차:**

### 11.1 v3 기존 스키마와 충돌 체크

현재 레포의 `supabase/migrations/`를 스캔해서 비교 표를 작성한다.

```text
## v3 기존 테이블 vs 4단 신규 테이블 비교

| 테이블 | v3 존재 | 4단 정의 | 처리 방침 |
|--------|---------|---------|---------|
| users / user_profiles | ✓ (v3) | ✓ (v6 ALTER) | `profiles` 개념은 users + user_profiles 로 매핑 |
| ... | | | |

## v3에만 있고 4단에 없는 테이블
(삭제 금지 — Foundation 2.4)

## RLS 미적용 테이블 목록
(20240100_rls_baseline_existing_tables.sql 작업 대상)
```

#### 11.1.1 실행 대조 결과 (2026-04-24, `202602*`·`202603*` 스캔)

**스캔 범위:** `supabase/migrations/` 내 `20260201000000_initial_public_schema.sql` 및 이후 `202603*` 전부(`create table` / `create table if not exists` / 주요 `alter table` 기준).

**문서 v6 매핑(4단 초안 → 실제 테이블명):** `profiles`→`users`+`user_profiles`, `travelers`→`traveler_profiles`, `guardians`→`guardian_profiles`, `custom_route_requests`→`bookings`, `reviews`→`traveler_reviews`. **신규 CREATE:** `guardian_applications`, `spot_catalog`, `routes`, `route_spots`, `orders`, `route_generation_jobs`, `message_threads`, `messages`.

| 대상 | 기존 `public` 동일 테이블명 존재? | 비고 |
|------------|----------------------------------|------|
| users / user_profiles | **예** | v6 `ALTER`만 추가. |
| traveler_profiles | **예** | v6 `ALTER` + RLS 보강. |
| guardian_profiles | **예** | v6 `ALTER` + RLS 보강. |
| guardian_applications | **아니오** | `20260401000007` |
| spot_catalog | **아니오** | |
| routes | **아니오** | `content_posts.route_journey` 등과 별개. |
| route_spots | **아니오** | |
| bookings (의뢰 확장) | **예** | v6 `20260401000005a`(enum) + `05b`(컬럼) + RLS 보강. |
| orders | **아니오** | `booking_id` FK. |
| route_generation_jobs | **아니오** | |
| message_threads / messages | **아니오** | `booking_id` FK. |
| traveler_reviews (확장) | **예** | v6 `ALTER`(route_id, is_anonymous) + RLS 보강. |
| guardian_reviews (RLS만) | **예** | RLS 보강. |

**기존 `public` 테이블(요약):** `users`, `regions`, `content_categories`, `content_posts`, `traveler_profiles`, `guardian_profiles`, `guardian_languages`, `guardian_activity_logs`, `featured_guardians`, `contact_methods`, `service_types`, `bookings`, `booking_status_history`, `traveler_reviews`, `guardian_reviews`, `incidents`, `admin_notes`, `mypage_menu_attention_seen`, `user_profiles`, `admin_accounts`, `point_policy_versions`, `point_ledger`, `point_balance_snapshot`, `matches`, `traveler_saved_guardians`, `traveler_saved_posts`, `mypage_block_attention_seen` 등.

**동일 테이블·동일 컬럼 DDL 충돌:** 신규 `CREATE TABLE` 이름이 기존과 겹치지 않아 **없음**. 향후 기존 테이블 `ALTER` 병합 시에만 컬럼 단위 재검토.

**RLS:** 일부 테이블은 이미 RLS 적용됨. 4단 신규는 별도 마이그레이션으로 추가.

**결론:** `DATA_MODEL_API.md` 는 v6 매핑으로 갱신됨. DB 적용은 **`20260401*` 마이그레이션 파일**을 형이 검토한 뒤 `supabase db push` 로 수행. **DROP 없이** `ALTER`·`CREATE`·RLS 보강만.

### 11.2 마이그레이션 실행 계획서

실행 순서, 기존 함수/트리거 중복 여부, FK 순서, 위험 요소, 결정 필요 사항.

### 11.3 로컬 환경 셋업 확인 후 실행

```bash
supabase start
supabase db push
pnpm exec supabase gen types typescript --local > src/types/database.types.ts
# 시드는 프로젝트 정책에 맞게
```

---

## 문서 버전

- 4단 Data Model & API · **1.0** · [FOUNDATION.md](./FOUNDATION.md) / [IA_SCREEN_INVENTORY.md](./IA_SCREEN_INVENTORY.md) 기반
- **1.0.1** — 링크 `FOUNDATION.md`·`IA_SCREEN_INVENTORY.md`로 통일, `src/app/api`·`src/lib/validation`·마이그레이션 타임스탬프·PostGIS·RLS `old.status`·`env.example` 저장소 메모 반영
- **1.0.2** — §2.5: `spot_catalog` 위치 인덱스 제거·Phase 2 주석. §2.8: `crr_update_guardian_limited`/`old.status` 제거, `status`는 service_role API 전용 주석 + `crr_update_guardian_owned_row` 단순화. §11.1.1 대조 리포트 추가.
- **1.0.3** — §1·§2~§7·§11: v6 테이블명 매핑(`users`/`user_profiles`, `traveler_profiles`, `guardian_profiles`, `bookings`, `traveler_reviews`). §3: `20260401*` 마이그레이션 목록 반영. `bookings`/`orders`/`messages` FK 및 Zod `booking_id`·`guardian_user_id` 정합.
- **1.0.4** — Admin RLS: `public.users.app_role = 'admin'` 존재 서브쿼리로 통일. `booking_status` enum 을 `20260401000005a` / 컬럼 `05b` 로 분리. `traveler_reviews` INSERT 허용 상태 `delivered|completed`. `guardian_profiles` 공개 SELECT 정책 및 주석 정합. §2.14 트리거 활성화 시점 문구 추가.
