-- Dev mock guardian (mgXX) has no Supabase JWT; list threads by trusted UUID (service_role only).

create or replace function public.service_message_threads_list_for_user(p_user_id uuid)
returns table (
  id uuid,
  booking_id uuid,
  inquiry_kind text,
  traveler_user_id uuid,
  guardian_user_id uuid,
  max_messages_traveler int,
  traveler_message_count int,
  last_message_at timestamptz,
  created_at timestamptz,
  content_post_id uuid,
  other_user_id uuid,
  other_display_name text,
  other_avatar_url text,
  unread_count bigint,
  last_message_preview text,
  message_count bigint
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    mt.id,
    mt.booking_id,
    mt.inquiry_kind::text,
    mt.traveler_user_id,
    mt.guardian_user_id,
    mt.max_messages_traveler,
    mt.traveler_message_count,
    mt.last_message_at,
    mt.created_at,
    mt.content_post_id,
    case
      when mt.traveler_user_id = p_user_id then mt.guardian_user_id
      else mt.traveler_user_id
    end as other_user_id,
    case
      when mt.traveler_user_id = p_user_id then
        coalesce(
          (select gp.display_name from public.guardian_profiles gp where gp.user_id = mt.guardian_user_id),
          '하루이'
        )
      else
        coalesce(
          (select gp.display_name from public.guardian_profiles gp where gp.user_id = mt.traveler_user_id),
          '여행자'
        )
    end as other_display_name,
    case
      when mt.traveler_user_id = p_user_id then
        nullif(
          coalesce(
            nullif((select gp.avatar_image_url from public.guardian_profiles gp where gp.user_id = mt.guardian_user_id), ''),
            nullif((select gp.photo_url from public.guardian_profiles gp where gp.user_id = mt.guardian_user_id), '')
          ),
          ''
        )
      else
        nullif(
          coalesce(
            nullif((select gp.avatar_image_url from public.guardian_profiles gp where gp.user_id = mt.traveler_user_id), ''),
            nullif((select gp.photo_url from public.guardian_profiles gp where gp.user_id = mt.traveler_user_id), '')
          ),
          ''
        )
    end as other_avatar_url,
    (select count(*)::bigint from public.messages m
      where m.thread_id = mt.id
        and not m.is_read
        and m.sender_user_id is distinct from p_user_id) as unread_count,
    (select left(m.content, 160) from public.messages m
      where m.thread_id = mt.id
      order by m.created_at desc nulls last
      limit 1) as last_message_preview,
    (select count(*)::bigint from public.messages m2 where m2.thread_id = mt.id) as message_count
  from public.message_threads mt
  where (mt.traveler_user_id = p_user_id or mt.guardian_user_id = p_user_id)
    and exists (select 1 from public.messages m0 where m0.thread_id = mt.id)
  order by mt.last_message_at desc nulls last, mt.created_at desc;
$$;

revoke all on function public.service_message_threads_list_for_user(uuid) from public;
grant execute on function public.service_message_threads_list_for_user(uuid) to service_role;
