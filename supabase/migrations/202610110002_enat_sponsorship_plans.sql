-- Editable ENAT sponsorship plans. Apply only to local/isolated homologation.
begin;
create table if not exists public.enat_sponsorship_plans (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  name text not null check (length(trim(name)) between 2 and 80),
  monthly_price numeric(12,2) not null check (monthly_price >= 0),
  tag text not null default '',
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.enat_sponsorship_plan_history (
  id bigint generated always as identity primary key,
  plan_id text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  old_values jsonb not null,
  new_values jsonb not null,
  changed_at timestamptz not null default now()
);
insert into public.enat_sponsorship_plans(id,name,monthly_price,tag,features,active,sort_order) values
('presenca','Presença',297,'Para começar','["Presença da marca em espaço institucional de parceiros","1 publicação patrocinada por mês","Identificação como conteúdo patrocinado"]'::jsonb,true,1),
('destaque','Destaque',697,'Mais visibilidade','["Benefícios do plano Presença","4 publicações patrocinadas por mês","Marca em destaque na área de parceiros","Relatório mensal de entregas"]'::jsonb,true,2),
('master','Master',1497,'Máxima exposição','["Benefícios do plano Destaque","Patrocínio de 1 live por mês","Destaque institucional prioritário","Relatório mensal consolidado"]'::jsonb,true,3)
on conflict (id) do nothing;
alter table public.enat_sponsorship_plans enable row level security;
alter table public.enat_sponsorship_plan_history enable row level security;
revoke all on public.enat_sponsorship_plans, public.enat_sponsorship_plan_history from anon, authenticated;
grant select on public.enat_sponsorship_plans to anon, authenticated;
grant insert, update, delete on public.enat_sponsorship_plans to authenticated;
grant select, insert on public.enat_sponsorship_plan_history to authenticated;
drop policy if exists enat_sponsorship_plans_public_read on public.enat_sponsorship_plans;
create policy enat_sponsorship_plans_public_read on public.enat_sponsorship_plans for select to anon, authenticated using (active or (select public.cmnt_is_admin()));
drop policy if exists enat_sponsorship_plans_admin_write on public.enat_sponsorship_plans;
create policy enat_sponsorship_plans_admin_write on public.enat_sponsorship_plans for all to authenticated using ((select public.cmnt_is_admin())) with check ((select public.cmnt_is_admin()));
drop policy if exists enat_sponsorship_plan_history_admin_read on public.enat_sponsorship_plan_history;
create policy enat_sponsorship_plan_history_admin_read on public.enat_sponsorship_plan_history for select to authenticated using ((select public.cmnt_is_admin()));
drop policy if exists enat_sponsorship_plan_history_admin_insert on public.enat_sponsorship_plan_history;
create policy enat_sponsorship_plan_history_admin_insert on public.enat_sponsorship_plan_history for insert to authenticated with check ((select public.cmnt_is_admin()) and actor_user_id = auth.uid());
create or replace function public.enat_sponsorship_plan_audit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.enat_sponsorship_plan_history(plan_id,actor_user_id,old_values,new_values)
    values(new.id,auth.uid(),'{}'::jsonb,to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.enat_sponsorship_plan_history(plan_id,actor_user_id,old_values,new_values)
    values(new.id,auth.uid(),to_jsonb(old),to_jsonb(new));
    new.updated_at = now();
    return new;
  else
    insert into public.enat_sponsorship_plan_history(plan_id,actor_user_id,old_values,new_values)
    values(old.id,auth.uid(),to_jsonb(old),jsonb_build_object('deleted',true,'id',old.id));
    return old;
  end if;
end;
$$;
drop trigger if exists enat_sponsorship_plan_audit_trigger on public.enat_sponsorship_plans;
create trigger enat_sponsorship_plan_audit_trigger after insert or update or delete on public.enat_sponsorship_plans for each row execute function public.enat_sponsorship_plan_audit();
revoke all on function public.enat_sponsorship_plan_audit() from public, anon, authenticated;
commit;
