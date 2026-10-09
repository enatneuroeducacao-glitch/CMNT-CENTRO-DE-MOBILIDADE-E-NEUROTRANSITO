-- The community validator requires a domain, purpose, scope and neurocientific type.
-- Keep governance_status, evidence_policy and moderation settings server-controlled.
grant insert (scientific_domain_id, scientific_purpose, scientific_scope, community_type)
  on table public.social_communities to authenticated;
