-- The JWT-verified onboarding Edge Function is the only browser path that writes identity/consent data.
-- service_role is used server-side after verifying the caller's JWT and validating the payload.
grant select, insert, update on table public.social_identity to service_role;
