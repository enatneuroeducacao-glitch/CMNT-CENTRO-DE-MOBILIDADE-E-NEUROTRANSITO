-- ENAT Editorial Studio — Fase 1
-- Execute no Supabase SQL Editor somente após revisão em homologação.
-- Admin authorization reuses the existing CMNT admin registry via (select public.cmnt_is_admin()).
create table if not exists public.enat_editorial_items (
  id uuid primary key default gen_random_uuid(),
  title varchar(180) not null,
  body text not null,
  category varchar(100) not null,
  editorial_date date,
  source_url text,
  status text not null default 'draft' check (status in ('draft','review','approved','rejected')),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enat_editorial_title_nonempty check (length(trim(title)) > 0),
  constraint enat_editorial_body_nonempty check (length(trim(body)) > 0),
  constraint enat_editorial_source_https check (source_url is null or source_url ~ '^https://')
);
create index if not exists enat_editorial_status_updated_idx on public.enat_editorial_items (status, updated_at desc);
create index if not exists enat_editorial_date_idx on public.enat_editorial_items (editorial_date);
alter table public.enat_editorial_items enable row level security;
revoke all on public.enat_editorial_items from anon, authenticated;
grant select, insert, update on public.enat_editorial_items to authenticated;
drop policy if exists enat_editorial_admin_select on public.enat_editorial_items;
create policy enat_editorial_admin_select on public.enat_editorial_items for select to authenticated using ((select public.cmnt_is_admin()));
drop policy if exists enat_editorial_admin_insert on public.enat_editorial_items;
create policy enat_editorial_admin_insert on public.enat_editorial_items for insert to authenticated with check ((select public.cmnt_is_admin()) and created_by = auth.uid() and updated_by = auth.uid());
drop policy if exists enat_editorial_admin_update on public.enat_editorial_items;
create policy enat_editorial_admin_update on public.enat_editorial_items for update to authenticated using ((select public.cmnt_is_admin())) with check ((select public.cmnt_is_admin()) and updated_by = auth.uid());

-- Keep ordering and audit timestamps accurate for every edit.
create or replace function public.enat_editorial_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists enat_editorial_items_set_updated_at on public.enat_editorial_items;
create trigger enat_editorial_items_set_updated_at
before update on public.enat_editorial_items
for each row execute function public.enat_editorial_set_updated_at();

revoke all on function public.enat_editorial_set_updated_at() from public, anon, authenticated;
