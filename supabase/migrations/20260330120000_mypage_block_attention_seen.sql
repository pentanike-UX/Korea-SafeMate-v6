-- Per-user block-level "seen" signatures for mypage attention (finer than LNB menu).

create table public.mypage_block_attention_seen (
  user_id text not null,
  block_key text not null,
  seen_signature text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, block_key)
);

create index mypage_block_attention_seen_user_updated_idx
  on public.mypage_block_attention_seen (user_id, updated_at desc);

comment on table public.mypage_block_attention_seen is
  'Stores last seen attention signatures per hub block key (e.g. traveler.matches.pending) for precise unread badges.';
