-- Direct messages: ensure the table and participant-only access are defined.
create table if not exists public.social_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.social_messages enable row level security;

create index if not exists idx_social_messages_sender_created
  on public.social_messages(sender_id, created_at desc);
create index if not exists idx_social_messages_recipient_created
  on public.social_messages(recipient_id, created_at desc);

-- Remove any older permissive policies so they cannot broaden access.
do $
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'social_messages'
  loop
    execute format('drop policy if exists %I on public.social_messages', p.policyname);
  end loop;
end $;

create policy social_messages_participant_select
  on public.social_messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy social_messages_sender_insert
  on public.social_messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and sender_id <> recipient_id
    and char_length(btrim(content)) between 1 and 5000
  );

create policy social_messages_recipient_read
  on public.social_messages for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

revoke all on table public.social_messages from public, anon, authenticated;
grant select, insert on table public.social_messages to authenticated;
grant update (read_at) on table public.social_messages to authenticated;
