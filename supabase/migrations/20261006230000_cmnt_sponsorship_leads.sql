create table if not exists public.cmnt_sponsorship_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text not null,
  whatsapp text,
  interest_type text not null,
  message text,
  consent boolean not null default false,
  source text not null default 'cmnt_header',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.cmnt_sponsorship_leads enable row level security;

drop policy if exists "cmnt sponsorship lead insert" on public.cmnt_sponsorship_leads;
create policy "cmnt sponsorship lead insert"
  on public.cmnt_sponsorship_leads
  for insert
  to anon, authenticated
  with check (consent = true);

create index if not exists idx_cmnt_sponsorship_leads_created_at
  on public.cmnt_sponsorship_leads(created_at desc);

create index if not exists idx_cmnt_sponsorship_leads_status
  on public.cmnt_sponsorship_leads(status);
