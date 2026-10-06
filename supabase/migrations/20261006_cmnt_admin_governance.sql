-- CMNT administrative governance
create table if not exists public.cmnt_admin_users(
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
 username text not null unique, email text, display_name text not null default '', role text not null default 'cmnt_admin',
 permissions jsonb not null default '["dashboard","users","communities","research","evidence","ethics","editorial","observatory","events","institutions","integrations","audit"]'::jsonb,
 active boolean not null default true, must_change_password boolean not null default true,
 last_password_change_at timestamptz, created_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.cmnt_admin_audit_log(
 id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id) on delete set null,
 action text not null, target_user_id uuid references auth.users(id) on delete set null,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
alter table public.cmnt_admin_users enable row level security;
alter table public.cmnt_admin_audit_log enable row level security;
create or replace function public.cmnt_is_admin() returns boolean language sql stable security definer set search_path='' as $
 select exists(select 1 from public.cmnt_admin_users a where a.user_id=(select auth.uid()) and a.active=true)
 or coalesce((auth.jwt()->'app_metadata'->>'role') in ('admin','cmnt_admin','administrator'),false);
$$;
drop policy if exists cmnt_admin_users_self on public.cmnt_admin_users;
create policy cmnt_admin_users_self on public.cmnt_admin_users for select to authenticated using(user_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_admin_users_admin on public.cmnt_admin_users;
create policy cmnt_admin_users_admin on public.cmnt_admin_users for all to authenticated using(public.cmnt_is_admin()) with check(public.cmnt_is_admin());
drop policy if exists cmnt_admin_audit_admin on public.cmnt_admin_audit_log;
create policy cmnt_admin_audit_admin on public.cmnt_admin_audit_log for select to authenticated using(public.cmnt_is_admin());
drop policy if exists cmnt_admin_audit_insert on public.cmnt_admin_audit_log;
create policy cmnt_admin_audit_insert on public.cmnt_admin_audit_log for insert to authenticated with check(actor_user_id=auth.uid() and public.cmnt_is_admin());
create or replace function public.cmnt_sync_admin_email() returns trigger language plpgsql security definer set search_path='' as $
begin if new.email is null then select u.email into new.email from auth.users u where u.id=new.user_id; end if; return new; end $$;
drop trigger if exists trg_cmnt_admin_email on public.cmnt_admin_users;
create trigger trg_cmnt_admin_email before insert or update on public.cmnt_admin_users for each row execute function public.cmnt_sync_admin_email();
create index if not exists idx_cmnt_admin_users_active on public.cmnt_admin_users(active);
create index if not exists idx_cmnt_admin_audit_created on public.cmnt_admin_audit_log(created_at desc);
revoke execute on function public.cmnt_is_admin() from public,anon;
grant execute on function public.cmnt_is_admin() to authenticated;
revoke execute on function public.cmnt_sync_admin_email() from public,anon,authenticated;
