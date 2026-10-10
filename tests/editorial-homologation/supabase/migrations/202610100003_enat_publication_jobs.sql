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
alter table public.enat_publication_jobs
  add column if not exists claimed_at timestamptz,
  add column if not exists claim_token uuid,
  add column if not exists idempotency_key text generated always as (editorial_item_id::text || ':' || channel) stored;
create unique index if not exists enat_publication_idempotency_key_idx
  on public.enat_publication_jobs (idempotency_key)
  where status in ('queued','publishing','published');
drop function if exists public.enat_claim_publication_jobs(integer);
create or replace function public.enat_claim_publication_jobs(p_limit integer default 10, p_channels text[] default null)
returns setof public.enat_publication_jobs
language plpgsql security definer set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  return query
  with due as (
    select j.id from public.enat_publication_jobs j
    join public.enat_editorial_items e on e.id = j.editorial_item_id
    where j.status = 'queued' and j.scheduled_at <= now() and e.status = 'approved'
      and (p_channels is null or j.channel = any(p_channels))
    order by j.scheduled_at, j.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  )
  update public.enat_publication_jobs j
  set status = 'publishing', attempt_count = j.attempt_count + 1,
      claimed_at = now(), claim_token = gen_random_uuid(), updated_at = now()
  from due where j.id = due.id returning j.*;
end;
$$;
revoke all on function public.enat_claim_publication_jobs(integer, text[]) from public, anon, authenticated;
grant execute on function public.enat_claim_publication_jobs(integer, text[]) to service_role;

revoke all on function public.enat_publication_validate_job() from public, anon, authenticated;

-- Finalize only a job held by the caller's current claim token.
-- Network ambiguity is handled as failed/manual reconciliation; never auto-requeue here.
create or replace function public.enat_finish_publication_job(
  p_job_id uuid,
  p_claim_token uuid,
  p_status text,
  p_remote_post_id text default null,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare changed integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_status not in ('published','failed') then
    raise exception 'Invalid terminal status' using errcode = '22023';
  end if;
  if p_status = 'published' and nullif(btrim(p_remote_post_id), '') is null then
    raise exception 'Remote post id required for published status' using errcode = '22023';
  end if;

  update public.enat_publication_jobs
  set status = p_status,
      remote_post_id = case when p_status = 'published' then p_remote_post_id else null end,
      published_at = case when p_status = 'published' then now() else null end,
      last_error = case when p_status = 'failed' then left(coalesce(nullif(btrim(p_error), ''), 'Falha sem detalhe; verificar reconciliação.'), 500) else null end,
      claimed_at = null,
      claim_token = null,
      updated_at = now()
  where id = p_job_id
    and status = 'publishing'
    and claim_token = p_claim_token;

  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function public.enat_finish_publication_job(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.enat_finish_publication_job(uuid, uuid, text, text, text) to service_role;


-- Recover stale claims into a terminal failed state for manual reconciliation.
-- Never requeue automatically: the external provider may have accepted the post before the worker crashed.
create or replace function public.enat_recover_stale_publication_jobs(p_stale_minutes integer default 15)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare changed integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  update public.enat_publication_jobs
  set status = 'failed',
      last_error = 'Tarefa presa em publishing; verificar a rede social e reconciliar manualmente antes de qualquer nova tentativa.',
      claimed_at = null,
      claim_token = null,
      updated_at = now()
  where status = 'publishing'
    and claimed_at is not null
    and claimed_at < now() - make_interval(mins => greatest(15, least(coalesce(p_stale_minutes, 15), 1440)));
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function public.enat_recover_stale_publication_jobs(integer) from public, anon, authenticated;
grant execute on function public.enat_recover_stale_publication_jobs(integer) to service_role;
