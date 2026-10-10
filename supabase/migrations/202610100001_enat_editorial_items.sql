-- ENAT Editorial Studio — Fase 1
-- Execute no Supabase SQL Editor somente após revisão em homologação.
-- Admin authorization uses trusted JWT app_metadata, never user-editable user_metadata.
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
create policy enat_editorial_admin_select on public.enat_editorial_items for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists enat_editorial_admin_insert on public.enat_editorial_items;
create policy enat_editorial_admin_insert on public.enat_editorial_items for insert to authenticated with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' and created_by = auth.uid() and updated_by = auth.uid());
drop policy if exists enat_editorial_admin_update on public.enat_editorial_items;
create policy enat_editorial_admin_update on public.enat_editorial_items for update to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' and updated_by = auth.uid());
