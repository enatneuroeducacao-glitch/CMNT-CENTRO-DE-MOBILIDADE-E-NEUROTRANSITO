-- CMNT Platform Expansion (additive)
-- Applied to Supabase before committing this migration source.
-- No existing social table is removed or renamed.

create table if not exists public.cmnt_institutions(
 id uuid primary key default gen_random_uuid(), name text not null, acronym text,
 institution_type text not null default 'research', country text not null default 'Brasil',
 state text, city text, website text, description text not null default '',
 verified boolean not null default false, created_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists public.cmnt_research_protocols(
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.cmnt_research_projects(id) on delete cascade,
 version text not null default '1.0', research_question text not null default '', objectives text not null default '',
 design text not null default '', inclusion_criteria text not null default '', exclusion_criteria text not null default '',
 variables jsonb not null default '[]'::jsonb, statistical_plan text not null default '', data_management text not null default '',
 ethics_notes text not null default '', status text not null default 'draft', created_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,version));

create table if not exists public.cmnt_ethics_reviews(
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.cmnt_research_projects(id) on delete cascade,
 review_type text not null default 'internal', status text not null default 'pending', protocol_version text,
 reference_code text, decision_notes text not null default '', reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz, created_at timestamptz not null default now());

create table if not exists public.cmnt_source_reviews(
 id uuid primary key default gen_random_uuid(), source_id uuid not null references public.cmnt_scientific_sources(id) on delete cascade,
 reviewer_id uuid references auth.users(id), decision text not null default 'pending', evidence_level text,
 methodological_quality text, bias_notes text not null default '', reviewer_notes text not null default '',
 created_at timestamptz not null default now(), reviewed_at timestamptz);

create table if not exists public.cmnt_content_classifications(
 post_id uuid primary key references public.social_posts(id) on delete cascade,
 content_type text not null default 'experiencia', scientific_status text not null default 'not_scientific',
 scientific_domain_id uuid references public.cmnt_scientific_domains(id), confidence numeric,
 classified_by uuid references auth.users(id), classified_at timestamptz not null default now());

alter table public.social_posts add column if not exists cmnt_content_type text not null default 'experiencia';
alter table public.social_posts add column if not exists cmnt_scientific_status text not null default 'not_scientific';
alter table public.social_posts add column if not exists cmnt_scientific_domain_id uuid references public.cmnt_scientific_domains(id);

create table if not exists public.cmnt_community_templates(
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
 scientific_domain_id uuid not null references public.cmnt_scientific_domains(id),
 purpose text not null, scope text not null, default_rules jsonb not null default '[]'::jsonb,
 active boolean not null default true, created_at timestamptz not null default now());

create table if not exists public.cmnt_observatory_data(
 id uuid primary key default gen_random_uuid(), indicator_id uuid not null references public.cmnt_observatory_indicators(id) on delete cascade,
 period_start date not null, period_end date not null, geography_level text not null default 'national',
 geography_code text, value numeric not null, sample_size integer, methodology_version text,
 provenance text not null default '', quality_status text not null default 'draft', published boolean not null default false,
 created_at timestamptz not null default now(),
 unique(indicator_id,period_start,period_end,geography_level,geography_code));

create table if not exists public.cmnt_public_datasets(
 id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
 publisher text not null default '', source_url text, license text, dataset_url text,
 geographic_scope text, temporal_scope text, methodology text not null default '',
 status text not null default 'draft', created_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists public.cmnt_events(
 id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
 event_type text not null default 'seminar', starts_at timestamptz not null, ends_at timestamptz,
 location text, online_url text, organizer_id uuid references auth.users(id),
 institution_id uuid references public.cmnt_institutions(id), scientific_domain_id uuid references public.cmnt_scientific_domains(id),
 status text not null default 'draft', published boolean not null default false, created_at timestamptz not null default now());

create table if not exists public.cmnt_event_registrations(
 event_id uuid not null references public.cmnt_events(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'registered', created_at timestamptz not null default now(),
 primary key(event_id,user_id));

create table if not exists public.cmnt_editorial_articles(
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
 summary text not null default '', body text not null default '', article_type text not null default 'analysis',
 scientific_domain_id uuid references public.cmnt_scientific_domains(id), author_id uuid references auth.users(id),
 editor_id uuid references auth.users(id), status text not null default 'draft', published_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists public.cmnt_editorial_reviews(
 id uuid primary key default gen_random_uuid(), article_id uuid not null references public.cmnt_editorial_articles(id) on delete cascade,
 reviewer_id uuid references auth.users(id), decision text not null default 'pending', notes text not null default '',
 created_at timestamptz not null default now(), reviewed_at timestamptz);

create table if not exists public.cmnt_research_submissions(
 id uuid primary key default gen_random_uuid(), project_id uuid references public.cmnt_research_projects(id) on delete set null,
 title text not null, abstract text not null default '', submission_type text not null default 'research',
 submitted_by uuid not null references auth.users(id), status text not null default 'submitted',
 assigned_editor uuid references auth.users(id), decision_notes text not null default '',
 submitted_at timestamptz not null default now(), decided_at timestamptz);

create table if not exists public.cmnt_knowledge_items(
 id uuid primary key default gen_random_uuid(), title text not null, summary text not null default '',
 content text not null default '', item_type text not null default 'concept',
 scientific_domain_id uuid references public.cmnt_scientific_domains(id),
 source_ids uuid[] not null default '{}', related_competencies text[] not null default '{}',
 status text not null default 'draft', created_by uuid references auth.users(id),
 reviewed_by uuid references auth.users(id), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now());

create table if not exists public.cmnt_ai_interactions(
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
 context_type text not null default 'general', input_summary text not null default '',
 output_summary text not null default '', source_count integer not null default 0,
 scientific_disclaimer text not null default 'A IA auxilia a síntese; não substitui avaliação científica, profissional ou ética.',
 human_review_required boolean not null default true, reviewed boolean not null default false,
 created_at timestamptz not null default now());

create table if not exists public.cmnt_integration_links(
 id uuid primary key default gen_random_uuid(), source_system text not null, source_record_id text not null,
 target_type text not null, target_record_id uuid, relation_type text not null,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
 unique(source_system,source_record_id,target_type,relation_type));

create table if not exists public.cmnt_national_partnerships(
 id uuid primary key default gen_random_uuid(), institution_id uuid references public.cmnt_institutions(id),
 name text not null, partnership_type text not null default 'institutional', scope text not null default '',
 status text not null default 'prospect', contact_notes text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create or replace function public.cmnt_is_admin() returns boolean language sql stable set search_path=public as $$
 select coalesce((auth.jwt()->'app_metadata'->>'role') in ('admin','cmnt_admin','administrator'),false);
$$;

alter table public.cmnt_institutions enable row level security;
alter table public.cmnt_research_protocols enable row level security;
alter table public.cmnt_ethics_reviews enable row level security;
alter table public.cmnt_source_reviews enable row level security;
alter table public.cmnt_content_classifications enable row level security;
alter table public.cmnt_community_templates enable row level security;
alter table public.cmnt_observatory_data enable row level security;
alter table public.cmnt_public_datasets enable row level security;
alter table public.cmnt_events enable row level security;
alter table public.cmnt_event_registrations enable row level security;
alter table public.cmnt_editorial_articles enable row level security;
alter table public.cmnt_editorial_reviews enable row level security;
alter table public.cmnt_research_submissions enable row level security;
alter table public.cmnt_knowledge_items enable row level security;
alter table public.cmnt_ai_interactions enable row level security;
alter table public.cmnt_integration_links enable row level security;
alter table public.cmnt_national_partnerships enable row level security;

-- Policies are intentionally restrictive; public publication requires published/verified state.
drop policy if exists cmnt_institutions_read on public.cmnt_institutions;
create policy cmnt_institutions_read on public.cmnt_institutions for select using (verified=true or created_by=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_institutions_admin on public.cmnt_institutions;
create policy cmnt_institutions_admin on public.cmnt_institutions for all to authenticated using (public.cmnt_is_admin()) with check (public.cmnt_is_admin());

drop policy if exists cmnt_protocols_access on public.cmnt_research_protocols;
create policy cmnt_protocols_access on public.cmnt_research_protocols for all to authenticated using (created_by=auth.uid() or public.cmnt_is_admin() or exists(select 1 from public.cmnt_research_projects p where p.id=project_id and p.owner_id=auth.uid())) with check (created_by=auth.uid() or public.cmnt_is_admin());

drop policy if exists cmnt_ethics_admin on public.cmnt_ethics_reviews;
create policy cmnt_ethics_admin on public.cmnt_ethics_reviews for all to authenticated using (public.cmnt_is_admin() or reviewed_by=auth.uid()) with check (public.cmnt_is_admin() or reviewed_by=auth.uid());
drop policy if exists cmnt_source_reviews_admin on public.cmnt_source_reviews;
create policy cmnt_source_reviews_admin on public.cmnt_source_reviews for all to authenticated using (public.cmnt_is_admin() or reviewer_id=auth.uid()) with check (public.cmnt_is_admin() or reviewer_id=auth.uid());
drop policy if exists cmnt_classifications_read on public.cmnt_content_classifications;
create policy cmnt_classifications_read on public.cmnt_content_classifications for select using (true);
drop policy if exists cmnt_classifications_write on public.cmnt_content_classifications;
create policy cmnt_classifications_write on public.cmnt_content_classifications for all to authenticated using (public.cmnt_is_admin() or classified_by=auth.uid()) with check (public.cmnt_is_admin() or classified_by=auth.uid());
drop policy if exists cmnt_templates_read on public.cmnt_community_templates;
create policy cmnt_templates_read on public.cmnt_community_templates for select using (active=true or public.cmnt_is_admin());
drop policy if exists cmnt_templates_admin on public.cmnt_community_templates;
create policy cmnt_templates_admin on public.cmnt_community_templates for all to authenticated using (public.cmnt_is_admin()) with check (public.cmnt_is_admin());
drop policy if exists cmnt_obs_data_public on public.cmnt_observatory_data;
create policy cmnt_obs_data_public on public.cmnt_observatory_data for select using (published=true);
drop policy if exists cmnt_obs_data_admin on public.cmnt_observatory_data;
create policy cmnt_obs_data_admin on public.cmnt_observatory_data for all to authenticated using (public.cmnt_is_admin()) with check (public.cmnt_is_admin());
drop policy if exists cmnt_datasets_public on public.cmnt_public_datasets;
create policy cmnt_datasets_public on public.cmnt_public_datasets for select using (status='published' or created_by=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_datasets_write on public.cmnt_public_datasets;
create policy cmnt_datasets_write on public.cmnt_public_datasets for all to authenticated using (created_by=auth.uid() or public.cmnt_is_admin()) with check (created_by=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_events_public on public.cmnt_events;
create policy cmnt_events_public on public.cmnt_events for select using (published=true or organizer_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_events_write on public.cmnt_events;
create policy cmnt_events_write on public.cmnt_events for all to authenticated using (organizer_id=auth.uid() or public.cmnt_is_admin()) with check (organizer_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_event_reg_self on public.cmnt_event_registrations;
create policy cmnt_event_reg_self on public.cmnt_event_registrations for all to authenticated using (user_id=auth.uid() or public.cmnt_is_admin()) with check (user_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_editorial_public on public.cmnt_editorial_articles;
create policy cmnt_editorial_public on public.cmnt_editorial_articles for select using (status='published' or author_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_editorial_write on public.cmnt_editorial_articles;
create policy cmnt_editorial_write on public.cmnt_editorial_articles for all to authenticated using (author_id=auth.uid() or public.cmnt_is_admin()) with check (author_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_editorial_reviews_admin on public.cmnt_editorial_reviews;
create policy cmnt_editorial_reviews_admin on public.cmnt_editorial_reviews for all to authenticated using (public.cmnt_is_admin() or reviewer_id=auth.uid()) with check (public.cmnt_is_admin() or reviewer_id=auth.uid());
drop policy if exists cmnt_submissions_read on public.cmnt_research_submissions;
create policy cmnt_submissions_read on public.cmnt_research_submissions for select to authenticated using (submitted_by=auth.uid() or assigned_editor=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_submissions_write on public.cmnt_research_submissions;
create policy cmnt_submissions_write on public.cmnt_research_submissions for all to authenticated using (submitted_by=auth.uid() or public.cmnt_is_admin()) with check (submitted_by=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_knowledge_public on public.cmnt_knowledge_items;
create policy cmnt_knowledge_public on public.cmnt_knowledge_items for select using (status='published' or created_by=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_knowledge_write on public.cmnt_knowledge_items;
create policy cmnt_knowledge_write on public.cmnt_knowledge_items for all to authenticated using (created_by=auth.uid() or public.cmnt_is_admin()) with check (created_by=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_ai_self on public.cmnt_ai_interactions;
create policy cmnt_ai_self on public.cmnt_ai_interactions for select to authenticated using (user_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_ai_insert on public.cmnt_ai_interactions for insert to authenticated with check (user_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_links_admin on public.cmnt_integration_links;
create policy cmnt_links_admin on public.cmnt_integration_links for all to authenticated using (public.cmnt_is_admin()) with check (public.cmnt_is_admin());
drop policy if exists cmnt_partnerships_public on public.cmnt_national_partnerships;
create policy cmnt_partnerships_public on public.cmnt_national_partnerships for select using (status='active' or public.cmnt_is_admin());
drop policy if exists cmnt_partnerships_admin on public.cmnt_national_partnerships;
create policy cmnt_partnerships_admin on public.cmnt_national_partnerships for all to authenticated using (public.cmnt_is_admin()) with check (public.cmnt_is_admin());

create index if not exists idx_cmnt_protocol_project on public.cmnt_research_protocols(project_id);
create index if not exists idx_cmnt_source_reviews_source on public.cmnt_source_reviews(source_id);
create index if not exists idx_cmnt_posts_domain on public.social_posts(cmnt_scientific_domain_id);
create index if not exists idx_cmnt_obs_period on public.cmnt_observatory_data(period_start,period_end);
create index if not exists idx_cmnt_events_start on public.cmnt_events(starts_at);
create index if not exists idx_cmnt_editorial_status on public.cmnt_editorial_articles(status);
create index if not exists idx_cmnt_submissions_status on public.cmnt_research_submissions(status);
