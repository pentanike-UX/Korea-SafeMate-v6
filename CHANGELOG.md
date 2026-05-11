# Changelog

## Unreleased — branch `claude/cool-davinci-38d3a9`

### Fixed
- **`/api/threads` 슬러그 입력 시 500** (PG 22P02). 가디언 식별자 정규화로 uuid·슬러그 모두 수용.
- **가디언 프로필 "이 하루이의 하루웨이" 항상 빈 상태**. uuid/슬러그 비대칭으로 mock 포스트 매칭 실패 → DB+mock 양쪽을 모두 검사하는 헬퍼로 교체.
- **inquiry 시트 입력/칩이 영구 disabled**. `threadError` 분기 + retry 패널 + 입력바 숨김으로 교체.

### Added
- `guardian_profiles.last_seen_at timestamptz` 컬럼 + index (5분 임계 온라인 판정).
- `src/lib/guardian-id-normalize.server.ts` — `normalizeGuardianRef()`.
- `src/lib/guardian-online.ts` — `isGuardianOnline()` (5분) + `isInquireNowOnProfileEnabled()`.
- `src/lib/posts-public-merged.server.ts` — `listPostsForGuardianByAnyRefMerged(refs)`.
- `src/lib/dev/mock-guardian-auth.ts` — `resolveSlugFromMockGuardianUuid(uuid)`.
- 가디언 프로필 hero 온라인 배지, aside "지금 문의하기" (flag), sticky mobile CTA.
- 가디언 목록·저장한 하루이에 온라인 배지 + "지금 문의하기".

### Feature flags
- `NEXT_PUBLIC_INQUIRE_NOW_ON_PROFILE` (기본 `"1"`). `"0"` 설정 시 프로필 aside의 "지금 문의하기" 버튼만 숨김. 정규화·하루웨이 채움은 무조건 활성(버그 수정).

## Rollback

DB:
```sql
drop index if exists public.guardian_profiles_last_seen_idx;
alter table public.guardian_profiles drop column if exists last_seen_at;
```

코드: 본 브랜치를 `git revert <merge-sha>` 또는 PR-A/B/C 각각 개별 revert.
