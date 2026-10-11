-- ENAT/Neurotrânsito commercial partnerships and sponsored placements.
-- VERSIONED ONLY: apply in local/isolated homologation, never production without explicit approval.
-- Social distribution is intentionally outside this workflow.
begin;

create table if not exists public.enat_partners (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (length(trim(legal_name)) > 0),
  trade_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  tax_id text,
  website_url text check (website_url is null or website_url ~* '^https://'),
  notes text,
  status text not null default 'prospect' check (status in ('prospect','active','paused','closed')),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enat_commercial_proposals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.enat_partners(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  placement_type text not null check (placement_type in ('sponsored_post','banner','featured_partner','newsletter','event','other')),
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'BRL' check (currency = 'BRL'),
  starts_on date,
  ends_on date,
  valid_until date,
  payment_terms text,
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected','expired','cancelled')),
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  decision_note text,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enat_proposal_dates_valid check (starts_on is null or ends_on is null or ends_on >= starts_on),
  constraint enat_proposal_approval_consistent check ((status = 'approved' and approved_by is not null and approved_at is not null) or status <> 'approved')
);

create table if not exists public.enat_commercial_payments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.enat_commercial_proposals(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('pix','bank_transfer','boleto','credit_card','cash','other')),
  status text not null default 'pending' check (status in ('pending','confirmed','failed','refunded','cancelled')),
  reference text,
  paid_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete restrict,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint enat_payment_confirmation_consistent check ((status = 'confirmed' and paid_at is not null and confirmed_by is not null) or status <> 'confirmed')
);

create table if not exists public.enat_commercial_campaigns (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.enat_commercial_proposals(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  placement_type text not null check (placement_type in ('sponsored_post','banner','featured_partner','newsletter','event','other')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'planned' check (status in ('planned','scheduled','active','completed','paused','cancelled')),
  content_url text check (content_url is null or content_url ~* '^https://'),
  creative_url text check (creative_url is null or creative_url ~* '^https://'),
  publication_url text check (publication_url is null or publication_url ~* '^https://'),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enat_campaign_dates_valid check (ends_at >= starts_at)
);

create table if not exists public.enat_campaign_deliverables (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.enat_commercial_campaigns(id) on delete restrict,
  deliverable_type text not null check (deliverable_type in ('publication_url','screenshot','creative_file','report','other')),
  label text not null check (length(trim(label)) > 0),
  asset_url text check (asset_url is null or asset_url ~* '^https://'),
  delivered_at timestamptz,
  delivered_by uuid references auth.users(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.enat_commercial_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in ('partner','proposal','payment','campaign','deliverable')),
  entity_id uuid not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists enat_partners_status_idx on public.enat_partners(status, legal_name);
create index if not exists enat_proposals_partner_idx on public.enat_commercial_proposals(partner_id, created_at desc);
create index if not exists enat_proposals_status_idx on public.enat_commercial_proposals(status, valid_until);
create index if not exists enat_payments_proposal_idx on public.enat_commercial_payments(proposal_id, status);
create index if not exists enat_campaigns_schedule_idx on public.enat_commercial_campaigns(starts_at, ends_at, status);
create index if not exists enat_deliverables_campaign_idx on public.enat_campaign_deliverables(campaign_id, created_at desc);
create index if not exists enat_commercial_audit_entity_idx on public.enat_commercial_audit_log(entity_type, entity_id, created_at desc);

alter table public.enat_partners enable row level security;
alter table public.enat_commercial_proposals enable row level security;
alter table public.enat_commercial_payments enable row level security;
alter table public.enat_commercial_campaigns enable row level security;
alter table public.enat_campaign_deliverables enable row level security;
alter table public.enat_commercial_audit_log enable row level security;

revoke all on public.enat_partners, public.enat_commercial_proposals, public.enat_commercial_payments, public.enat_commercial_campaigns, public.enat_campaign_deliverables, public.enat_commercial_audit_log from anon, authenticated;
grant select, insert, update, delete on public.enat_partners, public.enat_commercial_proposals, public.enat_commercial_payments, public.enat_commercial_campaigns, public.enat_campaign_deliverables to authenticated;
grant select, insert on public.enat_commercial_audit_log to authenticated;

drop policy if exists enat_partners_admin_all on public.enat_partners;
create policy enat_partners_admin_all on public.enat_partners for all to authenticated using ((select public.cmnt_is_admin())) with check ((select public.cmnt_is_admin()));
drop policy if exists enat_proposals_admin_all on public.enat_commercial_proposals;
create policy enat_proposals_admin_all on public.enat_commercial_proposals for all to authenticated using ((select public.cmnt_is_admin())) with check ((select public.cmnt_is_admin()));
drop policy if exists enat_payments_admin_all on public.enat_commercial_payments;
create policy enat_payments_admin_all on public.enat_commercial_payments for all to authenticated using ((select public.cmnt_is_admin())) with check ((select public.cmnt_is_admin()));
drop policy if exists enat_campaigns_admin_all on public.enat_commercial_campaigns;
create policy enat_campaigns_admin_all on public.enat_commercial_campaigns for all to authenticated using ((select public.cmnt_is_admin())) with check ((select public.cmnt_is_admin()));
drop policy if exists enat_deliverables_admin_all on public.enat_campaign_deliverables;
create policy enat_deliverables_admin_all on public.enat_campaign_deliverables for all to authenticated using ((select public.cmnt_is_admin())) with check ((select public.cmnt_is_admin()));
drop policy if exists enat_commercial_audit_admin_select on public.enat_commercial_audit_log;
create policy enat_commercial_audit_admin_select on public.enat_commercial_audit_log for select to authenticated using ((select public.cmnt_is_admin()));
drop policy if exists enat_commercial_audit_admin_insert on public.enat_commercial_audit_log;
create policy enat_commercial_audit_admin_insert on public.enat_commercial_audit_log for insert to authenticated with check ((select public.cmnt_is_admin()) and actor_user_id = auth.uid());

create or replace function public.enat_commercial_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  proposal_status text;
  proposal_id_value uuid;
  paid_total numeric(12,2);
  proposal_amount numeric(12,2);
begin
  if tg_table_name = 'enat_commercial_proposals' then
    if new.status = 'approved' and (new.approved_by is null or new.approved_at is null) then
      raise exception 'proposal_approval_requires_actor_and_timestamp';
    end if;
    return new;
  elsif tg_table_name = 'enat_commercial_payments' then
    if new.status = 'confirmed' and (new.paid_at is null or new.confirmed_by is null) then
      raise exception 'payment_confirmation_requires_actor_and_timestamp';
    end if;
    if new.status = 'confirmed' and new.confirmed_by <> auth.uid() and auth.role() <> 'service_role' then
      raise exception 'payment_confirmation_actor_must_match_session';
    end if;
    return new;
  else
    select p.status, p.amount into proposal_status, proposal_amount
      from public.enat_commercial_proposals p where p.id = new.proposal_id;
    if proposal_status is distinct from 'approved' then
      raise exception 'campaign_requires_approved_proposal';
    end if;
    select coalesce(sum(pay.amount),0) into paid_total
      from public.enat_commercial_payments pay
      where pay.proposal_id = new.proposal_id and pay.status = 'confirmed';
    if paid_total < proposal_amount then
      raise exception 'campaign_requires_full_confirmed_payment';
    end if;
    return new;
  end if;
end;
$$;

drop trigger if exists enat_commercial_proposal_guard on public.enat_commercial_proposals;
create trigger enat_commercial_proposal_guard before insert or update on public.enat_commercial_proposals for each row execute function public.enat_commercial_guard();
drop trigger if exists enat_commercial_payment_guard on public.enat_commercial_payments;
create trigger enat_commercial_payment_guard before insert or update on public.enat_commercial_payments for each row execute function public.enat_commercial_guard();
drop trigger if exists enat_commercial_campaign_guard on public.enat_commercial_campaigns;
create trigger enat_commercial_campaign_guard before insert or update on public.enat_commercial_campaigns for each row execute function public.enat_commercial_guard();

create or replace function public.enat_commercial_set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists enat_partners_set_updated_at on public.enat_partners;
create trigger enat_partners_set_updated_at before update on public.enat_partners for each row execute function public.enat_commercial_set_updated_at();
drop trigger if exists enat_proposals_set_updated_at on public.enat_commercial_proposals;
create trigger enat_proposals_set_updated_at before update on public.enat_commercial_proposals for each row execute function public.enat_commercial_set_updated_at();
drop trigger if exists enat_campaigns_set_updated_at on public.enat_commercial_campaigns;
create trigger enat_campaigns_set_updated_at before update on public.enat_commercial_campaigns for each row execute function public.enat_commercial_set_updated_at();

revoke all on function public.enat_commercial_guard() from public, anon, authenticated;
revoke all on function public.enat_commercial_set_updated_at() from public, anon, authenticated;
commit;
