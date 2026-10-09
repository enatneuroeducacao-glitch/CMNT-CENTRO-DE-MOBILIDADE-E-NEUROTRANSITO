-- The financial snapshot validates auth.uid() against the requested user.
-- Restrict direct invocation to authenticated users and trusted server-side callers.
revoke execute on function public.enat_financial_snapshot(uuid) from public, anon;
grant execute on function public.enat_financial_snapshot(uuid) to authenticated, service_role;

-- These routines are invoked by database triggers, not as public RPC endpoints.
revoke execute on function public.enat_hub_sync_completed_hsi_lesson() from public, anon, authenticated;
revoke execute on function public.enat_mail_messages_touch() from public, anon, authenticated;
revoke execute on function public.handle_new_ai_profile() from public, anon, authenticated;
revoke execute on function public.prevent_admin_profile_delete() from public, anon, authenticated;
revoke execute on function public.social_handle_new_user() from public, anon, authenticated;
