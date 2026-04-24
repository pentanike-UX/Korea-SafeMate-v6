-- Per-user menu "seen" signatures for mypage attention badges (device sync).
-- user_id is text to support dev mock ids (e.g. mg01) as well as UUID auth ids.

create table if not exists public.mypage_menu_attention_seen (
  user_id text not null,
  menu_key text not null,
  seen_signature text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, menu_key)
);

create index if not exists mypage_menu_attention_seen_user_updated_idx on public.mypage_menu_attention_seen (user_id, updated_at desc);

comment on table public.mypage_menu_attention_seen is
  'Stores last seen attention signatures per mypage LNB menu key for cross-device unread sync.';
