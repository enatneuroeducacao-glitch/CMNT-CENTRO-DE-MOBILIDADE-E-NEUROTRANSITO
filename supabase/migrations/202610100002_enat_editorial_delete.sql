-- Allow authorized CMNT/ENAT administrators to delete editorial records.
-- The UI requires explicit confirmation before issuing DELETE.
grant delete on public.enat_editorial_items to authenticated;
drop policy if exists enat_editorial_admin_delete on public.enat_editorial_items;
create policy enat_editorial_admin_delete
on public.enat_editorial_items
for delete
to authenticated
using ((select public.cmnt_is_admin()));
