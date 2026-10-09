-- This SECURITY DEFINER trigger uses fully-qualified table names and built-in functions only.
-- An empty search_path prevents shadowing through writable schemas.
alter function public.social_handle_new_user() set search_path = '';
