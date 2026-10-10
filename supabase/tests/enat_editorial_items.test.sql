begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select has_table('public', 'enat_editorial_items', 'Editorial table exists');

select ok(
  (select c.relrowsecurity from pg_class c where c.oid = 'public.enat_editorial_items'::regclass),
  'Row-level security is enabled'
);

select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enat_editorial_items' and policyname = 'enat_editorial_admin_select'), 'Admin-only SELECT policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enat_editorial_items' and policyname = 'enat_editorial_admin_insert'), 'Admin-only INSERT policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enat_editorial_items' and policyname = 'enat_editorial_admin_update'), 'Admin-only UPDATE policy exists');

select ok(
  not has_table_privilege('anon', 'public.enat_editorial_items', 'select'),
  'Anonymous role cannot SELECT editorial content'
);

select ok(
  not has_table_privilege('authenticated', 'public.enat_editorial_items', 'delete'),
  'Authenticated role cannot DELETE editorial content'
);

select ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'enat_editorial_items'
      and t.tgname = 'enat_editorial_items_set_updated_at'
      and not t.tgisinternal
  ),
  'Updated-at trigger exists'
);

-- Exercise the actual RLS policies with an admin and a non-admin JWT.
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'editorial-admin@test.invalid', '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'editorial-member@test.invalid', '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

insert into public.cmnt_admin_users (user_id, active)
values ('00000000-0000-0000-0000-000000000001', true)
on conflict (user_id) do update set active = true;

insert into public.enat_editorial_items (id, title, body, category, created_by, updated_by)
values ('00000000-0000-0000-0000-000000000101', 'Homologação editorial', 'Conteúdo de teste', 'Pesquisa e Evidências', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{}}';
select is((select count(*) from public.enat_editorial_items), 1::bigint, 'Admin can read editorial items');
select lives_ok(
  $insert into public.enat_editorial_items (title, body, category, created_by, updated_by)
    values ('Rascunho criado pelo admin', 'Conteúdo válido', 'Pesquisa e Evidências', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')$,
  'Admin can insert editorial items'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{}}';
select is((select count(*) from public.enat_editorial_items), 0::bigint, 'Non-admin cannot read editorial items');
select throws_ok(
  $insert into public.enat_editorial_items (title, body, category, created_by, updated_by)
    values ('Tentativa não autorizada', 'Conteúdo inválido', 'Pesquisa e Evidências', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002')$,
  '42501',
  'Non-admin insert is rejected by RLS'
);
reset role;

select * from finish();

rollback;
