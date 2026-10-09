create or replace function public.handle_new_ai_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_full_name text;
  v_city text;
  v_uf text;
  v_acting_city text;
  v_credential text;
  v_credential_uf text;
  v_category text;
  v_employment_type text;
  v_teaching_type text;
  v_person_type text;
  v_cnpj text;
  v_company_name text;
  v_trade_name text;
begin
  if coalesce(meta->>'system_role','') = 'admin'
     or lower(coalesce(new.email,'')) like '%@enat.local' then
    return new;
  end if;

  -- The shared project serves both the social network and NeuroDrive.
  -- Only instructor-signup metadata should create an ai_profiles instructor row.
  if not (
    lower(coalesce(meta->>'role','')) in ('instructor','instrutor')
    or meta ? 'credential'
    or meta ? 'registro'
    or meta ? 'credencial'
    or meta ? 'teaching_type'
    or meta ? 'teachingType'
    or meta ? 'employment_type'
    or meta ? 'employmentType'
    or meta ? 'category'
    or meta ? 'categoria'
    or meta ? 'cnpj'
    or meta ? 'company_name'
    or meta ? 'companyName'
  ) then
    return new;
  end if;

  v_full_name := coalesce(nullif(trim(meta->>'display_name'),''),nullif(trim(meta->>'full_name'),''),nullif(trim(meta->>'name'),''),'');
  v_uf := nullif(upper(trim(coalesce(meta->>'uf',meta->>'state',meta->>'estado',''))),'');
  v_city := nullif(trim(coalesce(meta->>'city',meta->>'municipality',meta->>'municipio',meta->>'cidade','')),'');
  v_acting_city := nullif(trim(coalesce(meta->>'acting_city',meta->>'actingCity',meta->>'municipality',meta->>'municipio',meta->>'city',meta->>'cidade','')),'');
  v_credential := nullif(trim(coalesce(meta->>'credential',meta->>'registro',meta->>'credencial','')),'');
  v_credential_uf := nullif(upper(trim(coalesce(meta->>'credential_uf',meta->>'credentialUf',meta->>'registro_uf',meta->>'registroUf',''))),'');
  v_category := nullif(trim(coalesce(meta->>'category',meta->>'categoria','')),'');

  v_employment_type := upper(trim(coalesce(meta->>'employment_type',meta->>'employmentType',meta->>'vinculo','')));
  v_employment_type := case
    when v_employment_type in ('AUTÔNOMO','AUTONOMO') then 'AUTÔNOMO'
    when v_employment_type='CLT' then 'CLT'
    when v_employment_type='AGREGADO' then 'AGREGADO'
    else null
  end;

  v_teaching_type := upper(trim(coalesce(meta->>'teaching_type',meta->>'teachingType',meta->>'modalidade','')));
  v_teaching_type := case
    when v_teaching_type in ('TEÓRICO','TEORICO') then 'TEÓRICO'
    when v_teaching_type in ('PRÁTICO','PRATICO') then 'PRÁTICO'
    when v_teaching_type in ('AMBOS','TEÓRICO E PRÁTICO','TEORICO E PRATICO','TEÓRICO E PRÁTICA','TEORICO E PRATICA') then 'AMBOS'
    else null
  end;

  v_person_type := coalesce(nullif(trim(coalesce(meta->>'person_type',meta->>'personType','')),''),'PF');
  v_cnpj := nullif(trim(coalesce(meta->>'cnpj','')),'');
  v_company_name := nullif(trim(coalesce(meta->>'company_name',meta->>'companyName','')),'');
  v_trade_name := nullif(trim(coalesce(meta->>'trade_name',meta->>'tradeName','')),'');

  insert into public.ai_profiles (
    id,full_name,email,role,city,uf,acting_city,credential,credential_uf,category,
    employment_type,teaching_type,person_type,cnpj,company_name,trade_name
  )
  values (
    new.id,v_full_name,new.email,'instructor',v_city,v_uf,v_acting_city,v_credential,
    v_credential_uf,v_category,v_employment_type,v_teaching_type,v_person_type,
    v_cnpj,v_company_name,v_trade_name
  )
  on conflict (id) do update set
    full_name=excluded.full_name,
    email=excluded.email,
    city=coalesce(excluded.city,public.ai_profiles.city),
    uf=coalesce(excluded.uf,public.ai_profiles.uf),
    acting_city=coalesce(excluded.acting_city,public.ai_profiles.acting_city),
    credential=coalesce(excluded.credential,public.ai_profiles.credential),
    credential_uf=coalesce(excluded.credential_uf,public.ai_profiles.credential_uf),
    category=coalesce(excluded.category,public.ai_profiles.category),
    employment_type=coalesce(excluded.employment_type,public.ai_profiles.employment_type),
    teaching_type=coalesce(excluded.teaching_type,public.ai_profiles.teaching_type),
    person_type=coalesce(excluded.person_type,public.ai_profiles.person_type),
    cnpj=coalesce(excluded.cnpj,public.ai_profiles.cnpj),
    company_name=coalesce(excluded.company_name,public.ai_profiles.company_name),
    trade_name=coalesce(excluded.trade_name,public.ai_profiles.trade_name),
    updated_at=now();

  return new;
end;
$function$;
