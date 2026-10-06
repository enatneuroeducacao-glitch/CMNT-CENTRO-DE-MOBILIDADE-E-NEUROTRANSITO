-- CMNT Neurocientífico — expansão aditiva
-- Regra: nenhuma tabela social existente é removida ou renomeada.
-- Esta migração apenas adiciona a camada científica e a governança das comunidades.

create table if not exists public.cmnt_scientific_domains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.cmnt_scientific_domains (slug,name,description) values
('neurociencia-do-transito','Neurociência do Trânsito','Cérebro, comportamento, atenção, emoção, decisão e risco aplicados à mobilidade.'),
('seguranca-viaria','Segurança Viária','Prevenção de sinistros, fatores humanos, comportamento e sistemas seguros.'),
('psicologia-do-transito','Psicologia do Trânsito','Processos psicológicos, comportamento e interação humana no trânsito.'),
('neuroeducacao','Neuroeducação','Aprendizagem, formação, treinamento e desenvolvimento de competências para mobilidade segura.'),
('neuroergonomia','Neuroergonomia','Relação entre pessoa, ambiente, veículo, tarefa, tecnologia e carga cognitiva.'),
('mobilidade-urbana','Mobilidade Urbana','Mobilidade, infraestrutura, transporte, acessibilidade e comportamento humano.'),
('fatores-humanos','Fatores Humanos','Desempenho, erro humano, tomada de decisão, fadiga, atenção e adaptação.'),
('comportamento-e-risco','Comportamento e Risco','Percepção de risco, impulsividade, autorregulação e responsabilidade.'),
('legislacao-e-politicas-publicas','Legislação e Políticas Públicas','Normas, políticas públicas e evidências para segurança e mobilidade.'),
('pesquisa-e-metodologia','Pesquisa e Metodologia','Métodos, instrumentos, estatística, ética e produção de evidências.'),
('tecnologia-e-inovacao','Tecnologia e Inovação','IA, simuladores, telemetria, sistemas inteligentes e tecnologias aplicadas.'),
('primeiros-socorros-e-emergencia','Primeiros Socorros e Emergência','Resposta humana e operacional a emergências no trânsito.')
on conflict (slug) do nothing;

alter table public.social_communities
  add column if not exists scientific_domain_id uuid references public.cmnt_scientific_domains(id),
  add column if not exists scientific_purpose text not null default '',
  add column if not exists scientific_scope text not null default '',
  add column if not exists evidence_policy text not null default 'Conteúdo técnico deve distinguir opinião, experiência e evidência.',
  add column if not exists community_type text not null default 'neurocientifica',
  add column if not exists governance_status text not null default 'active',
  add column if not exists requires_scientific_moderation boolean not null default true,
  add column if not exists created_from_template text;

create table if not exists public.cmnt_community_rules (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.social_communities(id) on delete cascade,
  rule_code text not null,
  title text not null,
  description text not null,
  mandatory boolean not null default true,
  created_at timestamptz not null default now(),
  unique (community_id, rule_code)
);

create table if not exists public.cmnt_researcher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  professional_summary text not null default '',
  scientific_bio text not null default '',
  research_areas text[] not null default '{}',
  institutions text[] not null default '{}',
  orcid text,
  lattes_url text,
  researcher_status text not null default 'member',
  verification_status text not null default 'unverified',
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmnt_research_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null,
  slug text not null unique,
  abstract text not null default '',
  objective text not null default '',
  hypothesis text not null default '',
  methodology text not null default '',
  study_type text not null default 'observational',
  status text not null default 'draft',
  scientific_domain_id uuid references public.cmnt_scientific_domains(id),
  ethics_status text not null default 'not_required_or_pending',
  data_policy text not null default 'aggregated_or_consent_based',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmnt_research_project_members (
  project_id uuid not null references public.cmnt_research_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'researcher',
  created_at timestamptz not null default now(),
  primary key (project_id,user_id)
);

create table if not exists public.cmnt_scientific_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null default 'article',
  authors text[] not null default '{}',
  abstract text not null default '',
  journal text,
  publication_year integer,
  doi text,
  pmid text,
  url text,
  methodology text,
  population text,
  evidence_level text not null default 'not_classified',
  review_status text not null default 'unreviewed',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmnt_content_evidence (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.social_posts(id) on delete cascade,
  source_id uuid not null references public.cmnt_scientific_sources(id) on delete cascade,
  relationship text not null default 'supports',
  note text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(post_id,source_id,relationship)
);

create table if not exists public.cmnt_learning_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  resource_type text not null default 'lesson',
  url text,
  scientific_domain_id uuid references public.cmnt_scientific_domains(id),
  level text not null default 'introductory',
  published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.cmnt_nexus_competencies (
  code text primary key,
  position integer not null unique,
  name text not null,
  description text not null default ''
);

insert into public.cmnt_nexus_competencies(code,position,name,description) values
('SA',1,'Consciência Situacional','Perceber o ambiente, contexto e mudanças relevantes.'),
('PR',2,'Percepção de Risco','Identificar, interpretar e antecipar riscos.'),
('TD',3,'Tomada de Decisão','Escolher respostas seguras sob pressão e incerteza.'),
('CV',4,'Controle Veicular','Integrar controle do veículo, tarefa e contexto.'),
('EC',5,'Comunicação Eficaz','Comunicar intenções e reduzir conflitos.'),
('RL',6,'Regulação e Legislação','Conhecer e aplicar normas e princípios de segurança.'),
('AD',7,'Adaptação','Ajustar comportamento às condições e mudanças.'),
('IE',8,'Inteligência Emocional','Reconhecer e regular estados emocionais.'),
('RS',9,'Responsabilidade Social','Considerar o impacto das decisões sobre os demais.'),
('AC',10,'Aprendizagem Contínua','Atualizar conhecimentos e competências.'),
('ER',11,'Ergonomia','Adequar pessoa, tarefa, ambiente e tecnologia.'),
('PS',12,'Primeiros Socorros','Responder adequadamente a emergências.')
on conflict (code) do nothing;

create table if not exists public.cmnt_nexus_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.cmnt_research_projects(id),
  instrument_version text not null default 'nexus-12-v1',
  status text not null default 'completed',
  overall_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.cmnt_nexus_results (
  assessment_id uuid not null references public.cmnt_nexus_assessments(id) on delete cascade,
  competency_code text not null references public.cmnt_nexus_competencies(code),
  score numeric not null,
  interpretation text not null default '',
  primary key (assessment_id,competency_code)
);

create table if not exists public.cmnt_observatory_indicators (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  unit text not null default 'index',
  source_domain text not null,
  public_level text not null default 'aggregated',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.cmnt_observatory_indicators(code,name,description,unit,source_domain) values
('IPR','Índice de Percepção de Risco','Indicador agregado de percepção de risco.','index','HSI/NEXUS'),
('II','Índice de Impulsividade','Indicador agregado de impulsividade comportamental.','index','HSI'),
('IIS','Índice de Influência Social','Indicador agregado de influência social sobre decisões.','index','HSI'),
('IRC','Índice de Responsabilidade Coletiva','Indicador agregado de responsabilidade coletiva.','index','HSI/NEXUS'),
('ISC','Índice de Segurança Comportamental','Indicador agregado de comportamento seguro.','index','HSI/NEXUS'),
('HSI','Human Safety Index','Indicador agregado de segurança humana.','index','HSI')
on conflict (code) do nothing;

-- Vincula as comunidades existentes a um domínio científico sem mudar nome, conteúdo ou membros.
update public.social_communities
set scientific_domain_id = (select id from public.cmnt_scientific_domains where slug='seguranca-viaria')
where scientific_domain_id is null;

update public.social_communities
set scientific_purpose = case
  when slug='instrutores-de-transito' then 'Formação, neuroeducação, fatores humanos e segurança na atividade de instrução.'
  when slug='joinville-sc' then 'Discussão baseada em evidências sobre mobilidade e segurança viária local.'
  when slug='mobilidade-urbana' then 'Investigar mobilidade urbana sob perspectivas humanas, ambientais, sociais e neurocomportamentais.'
  when slug='motociclistas' then 'Estudar fatores humanos, percepção de risco e segurança de motociclistas.'
  when slug='seguranca-viaria' then 'Promover prevenção de sinistros por meio de conhecimento, evidência e responsabilidade humana.'
  else scientific_purpose
end
where scientific_purpose='';

-- Regras culturais comuns do CMNT para comunidades existentes.
insert into public.cmnt_community_rules(community_id,rule_code,title,description)
select c.id, r.code, r.title, r.description
from public.social_communities c
cross join (values
 ('EVIDENCE','Evidência antes de afirmação','Distinguir opinião, experiência pessoal, hipótese e evidência científica.'),
 ('RESPECT','Respeito e humanização','Debater ideias sem atacar pessoas, grupos profissionais ou usuários.'),
 ('SAFETY','Segurança','Não incentivar direção perigosa, violência, rachas ou condutas de risco.'),
 ('SOURCES','Fontes','Sempre que possível, indicar fonte técnica, científica ou institucional.'),
 ('NO_PSEUDOSCIENCE','Sem pseudociência','Não apresentar alegações sem base como fatos científicos.'),
 ('PRIVACY','Privacidade','Não publicar dados pessoais ou informações de terceiros sem autorização.'),
 ('CIVIC','Responsabilidade social','Priorizar redução de danos, inclusão, cidadania e segurança coletiva.')
) r(code,title,description)
on conflict (community_id,rule_code) do nothing;

-- Índices adicionais, sem alterar os existentes.
create index if not exists idx_social_communities_scientific_domain on public.social_communities(scientific_domain_id);
create index if not exists idx_cmnt_projects_domain on public.cmnt_research_projects(scientific_domain_id);
create index if not exists idx_cmnt_sources_doi on public.cmnt_scientific_sources(doi);
create index if not exists idx_cmnt_nexus_user on public.cmnt_nexus_assessments(user_id);

-- RLS das novas tabelas.
alter table public.cmnt_scientific_domains enable row level security;
alter table public.cmnt_community_rules enable row level security;
alter table public.cmnt_researcher_profiles enable row level security;
alter table public.cmnt_research_projects enable row level security;
alter table public.cmnt_research_project_members enable row level security;
alter table public.cmnt_scientific_sources enable row level security;
alter table public.cmnt_content_evidence enable row level security;
alter table public.cmnt_learning_resources enable row level security;
alter table public.cmnt_nexus_competencies enable row level security;
alter table public.cmnt_nexus_assessments enable row level security;
alter table public.cmnt_nexus_results enable row level security;
alter table public.cmnt_observatory_indicators enable row level security;

drop policy if exists cmnt_domains_public_read on public.cmnt_scientific_domains;
create policy cmnt_domains_public_read on public.cmnt_scientific_domains for select using (active=true);

drop policy if exists cmnt_rules_public_read on public.cmnt_community_rules;
create policy cmnt_rules_public_read on public.cmnt_community_rules for select using (true);

drop policy if exists cmnt_researcher_public_read on public.cmnt_researcher_profiles;
create policy cmnt_researcher_public_read on public.cmnt_researcher_profiles for select using (true);
drop policy if exists cmnt_researcher_self_write on public.cmnt_researcher_profiles;
create policy cmnt_researcher_self_write on public.cmnt_researcher_profiles for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists cmnt_projects_public_read on public.cmnt_research_projects;
create policy cmnt_projects_public_read on public.cmnt_research_projects for select using (status='published' or owner_id=auth.uid());
drop policy if exists cmnt_projects_owner_write on public.cmnt_research_projects;
create policy cmnt_projects_owner_write on public.cmnt_research_projects for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());

drop policy if exists cmnt_project_members_read on public.cmnt_research_project_members;
create policy cmnt_project_members_read on public.cmnt_research_project_members for select using (true);
drop policy if exists cmnt_project_members_self_insert on public.cmnt_research_project_members;
create policy cmnt_project_members_self_insert on public.cmnt_research_project_members for insert with check (user_id=auth.uid());

drop policy if exists cmnt_sources_public_read on public.cmnt_scientific_sources;
create policy cmnt_sources_public_read on public.cmnt_scientific_sources for select using (review_status in ('reviewed','approved'));
drop policy if exists cmnt_sources_auth_insert on public.cmnt_scientific_sources;
create policy cmnt_sources_auth_insert on public.cmnt_scientific_sources for insert with check (auth.uid()=created_by);

drop policy if exists cmnt_evidence_public_read on public.cmnt_content_evidence;
create policy cmnt_evidence_public_read on public.cmnt_content_evidence for select using (true);
drop policy if exists cmnt_evidence_auth_insert on public.cmnt_content_evidence;
create policy cmnt_evidence_auth_insert on public.cmnt_content_evidence for insert with check (auth.uid()=created_by);

drop policy if exists cmnt_learning_public_read on public.cmnt_learning_resources;
create policy cmnt_learning_public_read on public.cmnt_learning_resources for select using (published=true);
drop policy if exists cmnt_learning_auth_insert on public.cmnt_learning_resources;
create policy cmnt_learning_auth_insert on public.cmnt_learning_resources for insert with check (auth.uid()=created_by);

drop policy if exists cmnt_nexus_competencies_public_read on public.cmnt_nexus_competencies;
create policy cmnt_nexus_competencies_public_read on public.cmnt_nexus_competencies for select using (true);

drop policy if exists cmnt_nexus_assessment_self on public.cmnt_nexus_assessments;
create policy cmnt_nexus_assessment_self on public.cmnt_nexus_assessments for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists cmnt_nexus_results_self on public.cmnt_nexus_results;
create policy cmnt_nexus_results_self on public.cmnt_nexus_results for all using (
  exists(select 1 from public.cmnt_nexus_assessments a where a.id=assessment_id and a.user_id=auth.uid())
) with check (
  exists(select 1 from public.cmnt_nexus_assessments a where a.id=assessment_id and a.user_id=auth.uid())
);

drop policy if exists cmnt_observatory_public_read on public.cmnt_observatory_indicators;
create policy cmnt_observatory_public_read on public.cmnt_observatory_indicators for select using (active=true);
