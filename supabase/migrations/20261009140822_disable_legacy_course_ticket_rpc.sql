-- The active NeuroDrive access flow uses the neurodrive-course-access Edge Function,
-- which atomically marks a ticket redeemed and issues a short-lived session.
-- Disable the legacy RPC that only updates last_used_at and permits ticket replay.
revoke execute on function public.neurodrive_redeem_course_access(text) from public, anon, authenticated;
grant execute on function public.neurodrive_redeem_course_access(text) to service_role;
