-- Ensure administrative authorization is revoked when an admin account is deactivated.
-- The database record is the source of truth; stale JWT app_metadata must not bypass it.
create or replace function public.cmnt_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cmnt_admin_users a
    where a.user_id = (select auth.uid())
      and a.active = true
  );
$$;

revoke execute on function public.cmnt_is_admin() from public, anon;
grant execute on function public.cmnt_is_admin() to authenticated;
