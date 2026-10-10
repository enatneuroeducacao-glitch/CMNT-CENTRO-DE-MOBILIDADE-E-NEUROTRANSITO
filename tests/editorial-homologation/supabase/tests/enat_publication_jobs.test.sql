begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
select has_table('public','enat_publication_jobs','Publication job queue exists');
select ok((select relrowsecurity from pg_class where oid='public.enat_publication_jobs'::regclass),'RLS is enabled on publication jobs');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='enat_publication_jobs' and policyname='enat_publication_admin_select'),'Admin-only read policy exists');
select ok(not has_table_privilege('anon','public.enat_publication_jobs','select'),'Anonymous users cannot read publication jobs');
select ok(exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.oid='public.enat_publication_jobs'::regclass and t.tgname='enat_publication_validate_job' and not t.tgisinternal),'Approved-content validation trigger exists');
insert into auth.users (id,aud,role,email,raw_app_meta_data,raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000011','authenticated','authenticated','phase2-admin@test.invalid','{}'::jsonb,'{}'::jsonb)
on conflict (id) do nothing;
insert into public.cmnt_admin_users (user_id,active) values ('00000000-0000-0000-0000-000000000011',true)
on conflict (user_id) do update set active=true;
insert into public.enat_editorial_items (id,title,body,category,status,created_by,updated_by)
values
 ('00000000-0000-0000-0000-000000000111','Rascunho de teste','Conteúdo para teste de fila','Pesquisa e Evidências','draft','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011'),
 ('00000000-0000-0000-0000-000000000112','Conteúdo aprovado','Conteúdo aprovado para agendamento','Pesquisa e Evidências','approved','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000011","role":"authenticated","app_metadata":{}}';
select throws_ok(
 $q$insert into public.enat_publication_jobs (editorial_item_id,channel,scheduled_at,created_by,updated_by)
 values ('00000000-0000-0000-0000-000000000111','instagram',now()+interval '1 day','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011')$q$,
 '23514', 'Somente conteúdo aprovado pode ser agendado ou publicado.',
 'Draft cannot be queued for publication'
);
select lives_ok(
 $q$insert into public.enat_publication_jobs (editorial_item_id,channel,scheduled_at,created_by,updated_by)
 values ('00000000-0000-0000-0000-000000000112','instagram',now()+interval '1 day','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011')$q$,
 'Approved content can be queued'
);
select throws_ok(
 $q$insert into public.enat_publication_jobs (editorial_item_id,channel,scheduled_at,created_by,updated_by)
 values ('00000000-0000-0000-0000-000000000112','instagram',now()+interval '2 days','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011')$q$,
 '23505', null,
 'Duplicate active item/channel publication is blocked'
);
reset role;
select * from finish();
rollback;
