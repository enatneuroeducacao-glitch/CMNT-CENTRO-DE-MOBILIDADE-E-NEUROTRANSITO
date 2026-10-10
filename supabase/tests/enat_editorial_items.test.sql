begin;

select plan(8);

select has_table('public', 'enat_editorial_items', 'Editorial table exists');

select ok(
  (select c.relrowsecurity from pg_class c where c.oid = 'public.enat_editorial_items'::regclass),
  'Row-level security is enabled'
);

select has_policy('public', 'enat_editorial_items', 'enat_editorial_admin_select', 'Admin-only SELECT policy exists');
select has_policy('public', 'enat_editorial_items', 'enat_editorial_admin_insert', 'Admin-only INSERT policy exists');
select has_policy('public', 'enat_editorial_items', 'enat_editorial_admin_update', 'Admin-only UPDATE policy exists');

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

select * from finish();

rollback;
