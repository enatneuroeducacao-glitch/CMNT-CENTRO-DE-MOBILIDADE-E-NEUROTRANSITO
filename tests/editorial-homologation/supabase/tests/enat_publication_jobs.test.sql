begin;
create extension if not exists pgtap with schema extensions;
select plan(20);
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
-- Privileged queue RPCs must reject authenticated users, even if they know function names.
select throws_ok(
 $q$select public.enat_claim_publication_jobs(1, null)$q$,
 '42501', null,
 'Authenticated users cannot claim publication jobs'
);
select throws_ok(
 $q$select public.enat_finish_publication_job('00000000-0000-0000-0000-000000000112'::uuid, gen_random_uuid(), 'failed', null, 'test')$q$,
 '42501', null,
 'Authenticated users cannot finalize publication jobs'
);
select throws_ok(
 $q$select public.enat_recover_stale_publication_jobs(15)$q$,
 '42501', null,
 'Authenticated users cannot recover stale publication jobs'
);
reset role;
-- A scheduled job whose editorial content was subsequently unapproved must never be claimed.
insert into public.enat_editorial_items (id,title,body,category,status,created_by,updated_by)
values ('00000000-0000-0000-0000-000000000113','Conteúdo revogado','Não deve ser processado','Pesquisa e Evidências','approved','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011');
insert into public.enat_publication_jobs (editorial_item_id,channel,scheduled_at,created_by,updated_by)
values ('00000000-0000-0000-0000-000000000113','facebook',now()-interval '1 minute','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011');
update public.enat_editorial_items set status='draft' where id='00000000-0000-0000-0000-000000000113';
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select is((select count(*)::integer from public.enat_claim_publication_jobs(10)),0,'Unapproved editorial content is never claimed by worker');
reset role;
-- Claim the approved future job only after making it due, then finalize it with the returned token.
update public.enat_publication_jobs
set scheduled_at = now() - interval '1 minute'
where editorial_item_id = '00000000-0000-0000-0000-000000000112'
  and channel = 'instagram' and status = 'queued';
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select is(
 (select count(*)::integer from public.enat_claim_publication_jobs(10) where editorial_item_id = '00000000-0000-0000-0000-000000000112'),
 1,
 'Approved due job can be claimed by service role'
);
select is(
 (select public.enat_finish_publication_job(id, gen_random_uuid(), 'published', 'wrong_token_post', null)
  from public.enat_publication_jobs
  where editorial_item_id = '00000000-0000-0000-0000-000000000112' and channel = 'instagram' and status = 'publishing'),
 false,
 'Incorrect claim token cannot finalize a publication job'
);
select is(
 (select public.enat_finish_publication_job(id, claim_token, 'published', 'mock_remote_post_123', null)
  from public.enat_publication_jobs
  where editorial_item_id = '00000000-0000-0000-0000-000000000112' and channel = 'instagram' and status = 'publishing'),
 true,
 'Correct claim token can finalize a publication job'
);
select is((select status from public.enat_publication_jobs where editorial_item_id='00000000-0000-0000-0000-000000000112' and channel='instagram'),'published','Finalized job is marked published');
reset role;

select has_function('public','enat_recover_stale_publication_jobs',ARRAY['integer'],'Stale publication recovery RPC exists');
insert into public.enat_editorial_items (id,title,body,category,status,created_by,updated_by)
values ('00000000-0000-0000-0000-000000000114','Claim antigo','Tarefa para testar recuperação','Pesquisa e Evidências','approved','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011');
insert into public.enat_publication_jobs (editorial_item_id,channel,scheduled_at,created_by,updated_by)
values ('00000000-0000-0000-0000-000000000114','facebook',now()-interval '1 hour','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011');
update public.enat_publication_jobs
set status='publishing', claimed_at=now()-interval '1 hour', claim_token='00000000-0000-0000-0000-000000000999'
where editorial_item_id='00000000-0000-0000-0000-000000000114' and channel='facebook';
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select is(public.enat_recover_stale_publication_jobs(15),1,'Stale publishing job is moved to manual reconciliation state');
select is((select status from public.enat_publication_jobs where editorial_item_id='00000000-0000-0000-0000-000000000114' and channel='facebook'),'failed','Recovered stale job is not automatically requeued');
reset role;

insert into public.enat_editorial_items (id,title,body,category,status,created_by,updated_by)
values ('00000000-0000-0000-0000-000000000115','Claim recente','Tarefa recente não deve ser recuperada','Pesquisa e Evidências','approved','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011');
insert into public.enat_publication_jobs (editorial_item_id,channel,scheduled_at,created_by,updated_by)
values ('00000000-0000-0000-0000-000000000115','linkedin',now()-interval '1 minute','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011');
update public.enat_publication_jobs
set status='publishing', claimed_at=now()-interval '2 minutes', claim_token='00000000-0000-0000-0000-000000000998'
where editorial_item_id='00000000-0000-0000-0000-000000000115' and channel='linkedin';
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select is(public.enat_recover_stale_publication_jobs(15),0,'Recent claim remains untouched by stale recovery');

reset role;
select * from finish();
rollback;
