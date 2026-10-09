-- Views use invoker privileges so underlying table grants and RLS policies apply.
-- In particular, this prevents a SECURITY DEFINER view from exposing counts
-- across posts that the caller is not allowed to see.
alter view public.social_post_stats set (security_invoker = true);
