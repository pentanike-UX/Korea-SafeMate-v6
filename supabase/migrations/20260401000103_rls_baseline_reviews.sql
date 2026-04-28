-- v6 RLS: traveler_reviews, guardian_reviews
-- traveler_reviews: 공개 읽기 + 본인 insert/update
-- guardian_reviews: 공개 읽기 + 본인(guardian) insert

alter table public.traveler_reviews enable row level security;

drop policy if exists "traveler_reviews_select_public" on public.traveler_reviews;
create policy "traveler_reviews_select_public"
  on public.traveler_reviews for select
  using (true);

drop policy if exists "traveler_reviews_insert_traveler" on public.traveler_reviews;
create policy "traveler_reviews_insert_traveler"
  on public.traveler_reviews for insert
  with check (
    traveler_user_id = auth.uid()
    and booking_id in (
      select b.id
      from public.bookings b
      where b.status in (
        'delivered'::public.booking_status,
        'completed'::public.booking_status
      )
    )
  );

drop policy if exists "traveler_reviews_update_own" on public.traveler_reviews;
create policy "traveler_reviews_update_own"
  on public.traveler_reviews for update
  using (
    traveler_user_id = auth.uid()
    and created_at > now() - interval '30 days'
  );

drop policy if exists "traveler_reviews_admin" on public.traveler_reviews;
create policy "traveler_reviews_admin"
  on public.traveler_reviews for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );

-- guardian_reviews

alter table public.guardian_reviews enable row level security;

drop policy if exists "guardian_reviews_select_public" on public.guardian_reviews;
create policy "guardian_reviews_select_public"
  on public.guardian_reviews for select
  using (true);

drop policy if exists "guardian_reviews_insert_guardian" on public.guardian_reviews;
create policy "guardian_reviews_insert_guardian"
  on public.guardian_reviews for insert
  with check (guardian_user_id = auth.uid());

drop policy if exists "guardian_reviews_admin" on public.guardian_reviews;
create policy "guardian_reviews_admin"
  on public.guardian_reviews for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and app_role = 'admin'
    )
  );
