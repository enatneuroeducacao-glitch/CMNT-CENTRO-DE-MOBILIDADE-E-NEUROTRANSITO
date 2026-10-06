-- CMNT Pending Features
create index if not exists idx_cmnt_researcher_verification on public.cmnt_researcher_profiles(verification_status);
create index if not exists idx_cmnt_submissions_user on public.cmnt_research_submissions(submitted_by,submitted_at);
create index if not exists idx_cmnt_event_reg_user on public.cmnt_event_registrations(user_id,created_at);
create index if not exists idx_cmnt_evidence_post on public.cmnt_content_evidence(post_id);
create index if not exists idx_cmnt_evidence_source on public.cmnt_content_evidence(source_id);
drop policy if exists cmnt_researcher_admin on public.cmnt_researcher_profiles;
create policy cmnt_researcher_admin on public.cmnt_researcher_profiles for all to authenticated using (public.cmnt_is_admin()) with check (public.cmnt_is_admin());
drop policy if exists cmnt_submissions_admin on public.cmnt_research_submissions;
create policy cmnt_submissions_admin on public.cmnt_research_submissions for all to authenticated using (public.cmnt_is_admin()) with check (public.cmnt_is_admin());
drop policy if exists cmnt_event_reg_self on public.cmnt_event_registrations;
create policy cmnt_event_reg_self on public.cmnt_event_registrations for all to authenticated using (user_id=auth.uid() or public.cmnt_is_admin()) with check (user_id=auth.uid() or public.cmnt_is_admin());
drop policy if exists cmnt_evidence_auth_insert on public.cmnt_content_evidence;
create policy cmnt_evidence_auth_insert on public.cmnt_content_evidence for insert to authenticated with check (auth.uid()=created_by or public.cmnt_is_admin());
drop policy if exists cmnt_evidence_author_delete on public.cmnt_content_evidence;
create policy cmnt_evidence_author_delete on public.cmnt_content_evidence for delete to authenticated using (auth.uid()=created_by or public.cmnt_is_admin());