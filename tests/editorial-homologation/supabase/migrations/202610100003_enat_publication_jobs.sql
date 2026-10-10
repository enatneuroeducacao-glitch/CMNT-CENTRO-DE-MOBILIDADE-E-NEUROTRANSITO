-- Isolated CI copy of the Phase 2 publication queue migration.
create table if not exists public.enat_publication_jobs (
  id uuid primary key default gen_random_uuid(),
  editorial_item_id uuid not null references public.enat_editorial_items(id) on delete restrict,
  channel text not null check (channel in ('instagram','facebook','linkedin','x')),
  status text not null default 'queued' check (status in ('queued','publishing','published','failed','cancelled')),
  scheduled_at timestamptz not null,
  timezone text not null default 'America/Sao_Paulo',
  payload_snapshot jsonb not null default '{}'::jsonb,
  remote_post_id text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  published_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enat_publication_published_has_timestamp check (status <> 'published' or published_at is not null)
);
create index if not exists enat_publication_due_idx on public.enat_publication_jobs (scheduled_at) where status = 'queued';
create index if not exists enat_publication_item_idx on public.enat_publication_jobs (editorial_item_id, scheduled_at desc);
create unique index if not exists enat_publication_active_item_channel_time_idx on public.enat_publication_jobs (editorial_item_id, channel, scheduled_at) where status <> 'cancelled';
create unique index if not exists enat_publication_active_item_channel_idx on public.enat_publication_jobs (editorial_item_id, channel) where status in ('queued','publishing','published');
alter table public.enat_publication_jobs enable row level security;
revoke all on public.enat_publication_jobs from anon, authenticated;
grant select, insert, update, delete on public.enat_publication_jobs to authenticated;
drop policy if exists enat_publication_admin_select on public.enat_publication_jobs;
create policy enat_publication_admin_select on public.enat_publication_jobs for select to authenticated using ((select public.cmnt_is_admin()));
drop policy if exists enat_publication_admin_insert on public.enat_publication_jobs;
create policy enat_publication_admin_insert on public.enat_publication_jobs for insert to authenticated with check ((select public.cmnt_is_admin()) and created_by = auth.uid() and updated_by = auth.uid());
drop policy if exists enat_publication_admin_update on public.enat_publication_jobs;
create policy enat_publication_admin_update on public.enat_publication_jobs for update to authenticated using ((select public.cmnt_is_admin())) with check ((select public.cmnt_is_admin()) and updated_by = auth.uid());
drop policy if exists enat_publication_admin_delete on public.enat_publication_jobs;
create policy enat_publication_admin_delete on public.enat_publication_jobs for delete to authenticated using ((select public.cmnt_is_admin()));
create or replace function public.enat_publication_validate_job()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare item_status text;
begin
  if new.status in ('queued','publishing') then
    select status into item_status from public.enat_editorial_items where id = new.editorial_item_id;
    if item_status is distinct from 'approved' then
      raise exception 'Somente conteúdo aprovado pode ser agendado ou publicado.' using errcode = '23514';
    end if;
  end if;
  if tg_op = 'UPDATE' then new.updated_at = now(); end if;
  return new;
end;
$$;
drop trigger if exists enat_publication_validate_job on public.enat_publication_jobs;
create trigger enat_publication_validate_job before insert or update on public.enat_publication_jobs for each row execute function public.enat_publication_validate_job();
revoke all on function public.enat_publication_validate_job() from public, anon, authenticated;
