-- The trigger function uses only NEW fields and built-in functions.
-- An empty search_path prevents shadowing by objects in writable schemas.
alter function public.enforce_instructor_location() set search_path = '';
