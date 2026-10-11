-- CMNT community governance enforcement
create or replace function public.cmnt_validate_new_community() returns trigger language plpgsql set search_path=public as $$ begin if new.scientific_domain_id is null or nullif(trim(new.scientific_purpose),'') is null or nullif(trim(new.scientific_scope),'') is null or coalesce(new.community_type,'') <> 'neurocientifica' then raise exception 'Toda nova comunidade do CMNT deve possuir dominio cientifico, proposito, escopo e tipo neurocientifico.'; end if; return new; end; $$;
do $
begin
  if to_regclass('public.social_communities') is not null then
    drop trigger if exists trg_cmnt_validate_new_community on public.social_communities;
    create trigger trg_cmnt_validate_new_community before insert on public.social_communities for each row execute function public.cmnt_validate_new_community();
  end if;
end;
$;