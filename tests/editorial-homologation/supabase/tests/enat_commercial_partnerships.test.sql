begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

select has_table('public','enat_partners','Commercial partners table exists');
select has_table('public','enat_commercial_proposals','Commercial proposals table exists');
select has_table('public','enat_commercial_payments','Commercial payments table exists');
select has_table('public','enat_commercial_campaigns','Commercial campaigns table exists');
select has_table('public','enat_campaign_deliverables','Campaign proof/deliverables table exists');

select ok((select relrowsecurity from pg_class where oid='public.enat_partners'::regclass),'Partners RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.enat_commercial_proposals'::regclass),'Proposals RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.enat_commercial_payments'::regclass),'Payments RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.enat_commercial_campaigns'::regclass),'Campaigns RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.enat_campaign_deliverables'::regclass),'Deliverables RLS enabled');

select ok(not has_table_privilege('anon','public.enat_partners','select'),'Anonymous cannot read partners');
select ok(not has_table_privilege('anon','public.enat_commercial_proposals','select'),'Anonymous cannot read proposals');
select ok(not has_table_privilege('anon','public.enat_commercial_payments','select'),'Anonymous cannot read payment records');
select ok(not has_table_privilege('anon','public.enat_commercial_campaigns','select'),'Anonymous cannot read campaigns');
select ok(not has_table_privilege('anon','public.enat_campaign_deliverables','select'),'Anonymous cannot read deliverables');

select ok(exists(select 1 from pg_trigger t where t.tgrelid='public.enat_commercial_campaigns'::regclass and t.tgname='enat_commercial_campaign_guard' and not t.tgisinternal),'Campaign approval/payment guard trigger exists');

insert into auth.users (id,aud,role,email,raw_app_meta_data,raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000021','authenticated','authenticated','commercial-admin@test.invalid','{}'::jsonb,'{}'::jsonb)
on conflict (id) do nothing;
insert into public.cmnt_admin_users (user_id,active) values ('00000000-0000-0000-0000-000000000021',true)
on conflict (user_id) do update set active=true;

insert into public.enat_partners (id,legal_name,created_by,updated_by)
values ('00000000-0000-0000-0000-000000000201','Parceiro Fictício de Homologação','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000021');
insert into public.enat_commercial_proposals (id,partner_id,title,description,placement_type,amount,status,created_by,updated_by)
values ('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000201','Proposta de Teste','Dados fictícios','sponsored_post',1500.00,'draft','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000021');

select throws_ok(
 $q$insert into public.enat_commercial_campaigns (proposal_id,title,placement_type,starts_at,ends_at,owner_user_id)
 values ('00000000-0000-0000-0000-000000000202','Campanha sem aprovação','sponsored_post',now(),now()+interval '1 day','00000000-0000-0000-0000-000000000021')$q$,
 'P0001', 'campaign_requires_approved_proposal',
 'Campaign cannot be created from an unapproved proposal'
);

update public.enat_commercial_proposals
set status='approved', approved_by='00000000-0000-0000-0000-000000000021', approved_at=now()
where id='00000000-0000-0000-0000-000000000202';

insert into public.enat_commercial_payments (proposal_id,amount,method,status,created_by)
values ('00000000-0000-0000-0000-000000000202',1500.00,'pix','pending','00000000-0000-0000-0000-000000000021');

select throws_ok(
 $q$insert into public.enat_commercial_campaigns (proposal_id,title,placement_type,starts_at,ends_at,owner_user_id)
 values ('00000000-0000-0000-0000-000000000202','Campanha sem pagamento','sponsored_post',now(),now()+interval '1 day','00000000-0000-0000-0000-000000000021')$q$,
 'P0001', 'campaign_requires_full_confirmed_payment',
 'Campaign cannot be created before full payment is confirmed'
);

update public.enat_commercial_payments
set status='confirmed', paid_at=now(), confirmed_by='00000000-0000-0000-0000-000000000021'
where proposal_id='00000000-0000-0000-0000-000000000202';

select lives_ok(
 $q$insert into public.enat_commercial_campaigns (proposal_id,title,placement_type,starts_at,ends_at,owner_user_id)
 values ('00000000-0000-0000-0000-000000000202','Campanha paga','sponsored_post',now(),now()+interval '1 day','00000000-0000-0000-0000-000000000021')$q$,
 'Approved and fully paid proposal can become a campaign'
);

rollback;
