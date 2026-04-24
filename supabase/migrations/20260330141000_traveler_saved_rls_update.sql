-- Allow upsert (ON CONFLICT DO UPDATE) for traveler save tables under RLS.

drop policy if exists "traveler_saved_guardians_update_own" on public.traveler_saved_guardians;
create policy "traveler_saved_guardians_update_own"
  on public.traveler_saved_guardians for update
  using (auth.uid() = traveler_user_id)
  with check (auth.uid() = traveler_user_id);

drop policy if exists "traveler_saved_posts_update_own" on public.traveler_saved_posts;
create policy "traveler_saved_posts_update_own"
  on public.traveler_saved_posts for update
  using (auth.uid() = traveler_user_id)
  with check (auth.uid() = traveler_user_id);
