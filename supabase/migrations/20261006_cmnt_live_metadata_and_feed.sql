alter table public.social_live_streams
  add column if not exists theme text,
  add column if not exists presenter_names jsonb not null default '[]'::jsonb,
  add column if not exists guest_mentions jsonb not null default '[]'::jsonb,
  add column if not exists publish_to_feed boolean not null default true,
  add column if not exists feed_post_id uuid;

create index if not exists idx_social_live_streams_feed_post_id
  on public.social_live_streams(feed_post_id);
