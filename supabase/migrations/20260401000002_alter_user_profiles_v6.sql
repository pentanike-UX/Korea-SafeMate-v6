-- v6: user_profiles — preferred_lang (locale 컬럼은 유지; 데이터 동기화는 별도 검토)
alter table public.user_profiles
  add column if not exists preferred_lang text not null default 'en'
    check (preferred_lang in ('ko', 'en', 'th', 'vi', 'id', 'fil'));
