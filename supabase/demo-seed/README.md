# Demo Seed (MVP 시연용)

이 폴더의 SQL은 **운영 마이그레이션이 아닙니다**. 시연용 데이터를 운영 DB에 1회 적용할 때만 수동 실행합니다.

## 적용 방법

### 권장: Node 스크립트 (auth.admin API + supabase-js)

```bash
node --env-file=.env.local scripts/apply-demo-seed.mjs
```

- `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` 사용.
- `auth.users` 4개는 `auth.admin.createUser`로 생성 (id 지정, email_confirm 자동).
- 나머지는 `from(...).upsert()` — 모두 멱등.
- **2026-05-27 운영 검증 완료** — `routes/public 1건, route_spots 5건, content_posts 1건` 확인.

### 대안: SQL 직접 실행

psql 또는 Supabase Dashboard → SQL Editor에 `2026-05-27-demo-content.sql` 내용을 붙여넣고 Run.

> ⚠️ `auth.users` INSERT는 **`supabase_admin` 역할**에서만 작동. Dashboard SQL Editor는 OK, 일반 service-role REST는 불가하므로 그 경로에서는 Node 스크립트 사용 권장.

모든 INSERT는 `on conflict do nothing` 또는 `upsert`로 멱등(idempotent)합니다 — 여러 번 실행해도 안전.

## 생성되는 데모 데이터

| 종류 | 개수 | 비고 |
|---|---|---|
| `auth.users` | 4 | 가디언 1명(mg14) + traveler 3명 (search 풀용) |
| `public.users` | 4 | role: guardian / traveler |
| `public.user_profiles` | 4 | display_name(검색 풀용) |
| `public.guardian_profiles` | 1 | mg14 김서호, AI 자동답변 ON, approved |
| `public.spot_catalog` | 5 | 종로 K-드라마 산책 5스팟 |
| `public.routes` | 1 | "서울 궁궐 골목에서 만나는 K-드라마 씬" |
| `public.route_spots` | 5 | 위 루트 ↔ 5스팟 매핑 |
| `public.content_posts` | 1 | hybrid 포스트, `related_route_id = demo route` |

## UUID (결정적 — `seedUuidV5`로 계산)

| 키 | UUID |
|---|---|
| guardian `mg14` | `2da22c42-ce72-5937-be7e-bddfbe036a4a` |
| route `demo-route-mg14-01` | `44553acb-fdef-5139-add4-9d1fbe92ff83` |
| post `seed-mg14-route-demo` | `9396611c-561c-5736-befd-baba8d3e3fd8` |
| traveler 1/2/3 | `4cc35b31-…` / `6d2fd2a0-…` / `16c88145-…` |
| spot 1~5 | `4d0927f4-…` / `e36c8933-…` / `b8a2b3da-…` / `108565b5-…` / `3228b525-…` |

## 데모 traveler 로그인

데모 traveler는 비밀번호가 없는 placeholder 계정입니다 (검색·초대 대상 풀로만 사용). 시연 중 직접 로그인은 시연자 본인의 실제 계정으로 합니다.

만약 traveler 계정으로도 직접 로그인 시연이 필요하면 별도로 Supabase Dashboard → Authentication에서 비밀번호 reset하거나 magic link를 보내세요.

## 제거

```sql
-- 이 시드만 제거 (운영 데이터는 보존)
delete from public.content_posts where seed_content_key = 'seed-mg14-route-demo';
delete from public.route_spots where route_id = '44553acb-fdef-5139-add4-9d1fbe92ff83';
delete from public.routes where id = '44553acb-fdef-5139-add4-9d1fbe92ff83';
delete from public.spot_catalog where id in (
  '4d0927f4-1107-5e0b-b560-123b067bcab8',
  'e36c8933-96d6-5fc6-a700-40132e2651de',
  'b8a2b3da-4e84-5640-b0fb-cf09a3517601',
  '108565b5-ce33-5a5d-a653-4e87409268a9',
  '3228b525-ee25-5abd-8fa0-f76049d2496c'
);
-- traveler/guardian 시드 user는 운영 사용자 충돌 가능성이 있어 명시적으로만 제거
delete from public.guardian_profiles where seed_guardian_key = 'mg14';
delete from auth.users where id in (
  '2da22c42-ce72-5937-be7e-bddfbe036a4a',
  '4cc35b31-9c0a-5f22-93c6-01e14a032297',
  '6d2fd2a0-f55b-53ef-bbf0-9321211b3a30',
  '16c88145-8e0e-5987-be8b-0bbd79e41d67'
);
```
