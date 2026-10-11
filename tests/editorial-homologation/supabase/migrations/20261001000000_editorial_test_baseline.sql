-- Minimal isolated baseline for ENAT Editorial Phase 1 tests.
-- This deliberately does not replay the application's historical migrations.
create table public.cmnt_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true
);
alter table public.cmnt_admin_users enable row level security;

create or replace function public.cmnt_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cmnt_admin_users a
    where a.user_id = (select auth.uid()) and a.active = true
  )
  or coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','cmnt_admin','administrator'),
    false
  );
$$;
revoke all on function public.cmnt_is_admin() from public, anon;
grant execute on function public.cmnt_is_admin() to authenticated;
