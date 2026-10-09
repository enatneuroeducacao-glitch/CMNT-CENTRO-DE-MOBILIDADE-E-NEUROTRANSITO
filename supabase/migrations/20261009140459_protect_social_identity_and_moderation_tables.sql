-- Identity and consent data is written by the trusted auth trigger, not by the browser.
revoke all on table public.social_identity from public, anon, authenticated;
grant select on table public.social_identity to authenticated;
drop policy if exists "Users can insert own social identity" on public.social_identity;
drop policy if exists "Users can update own social identity" on public.social_identity;
drop policy if exists "Users can view own social identity" on public.social_identity;
create policy social_identity_select_own
  on public.social_identity for select to authenticated
  using (user_id = (select auth.uid()));

-- Reports are private to the reporter; status is assigned by the database default/moderation.
revoke all on table public.social_reports from public, anon, authenticated;
grant select on table public.social_reports to authenticated;
grant insert (reporter_id, post_id, reason) on table public.social_reports to authenticated;
drop policy if exists social_reports_insert on public.social_reports;
drop policy if exists social_reports_read on public.social_reports;
create policy social_reports_insert
  on public.social_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy social_reports_read
  on public.social_reports for select to authenticated
  using (reporter_id = (select auth.uid()));

-- Hashtags are public metadata; clients cannot edit or delete arbitrary tags.
revoke all on table public.social_hashtags from public, anon, authenticated;
grant select on table public.social_hashtags to anon, authenticated;
grant insert (tag) on table public.social_hashtags to authenticated;
drop policy if exists social_hashtags_public on public.social_hashtags;
drop policy if exists social_hashtags_insert on public.social_hashtags;
create policy social_hashtags_public
  on public.social_hashtags for select to anon, authenticated using (true);
create policy social_hashtags_insert
  on public.social_hashtags for insert to authenticated
  with check ((select auth.uid()) is not null);

-- A user may attach hashtags only to posts they authored; hidden post tags stay hidden.
revoke all on table public.social_post_hashtags from public, anon, authenticated;
grant select on table public.social_post_hashtags to anon, authenticated;
grant insert (post_id, hashtag_id) on table public.social_post_hashtags to authenticated;
grant delete on table public.social_post_hashtags to authenticated;
drop policy if exists social_post_hashtags_public on public.social_post_hashtags;
drop policy if exists social_post_hashtags_write on public.social_post_hashtags;
create policy social_post_hashtags_visible
  on public.social_post_hashtags for select to anon, authenticated
  using (exists (select 1 from public.social_posts p where p.id = social_post_hashtags.post_id));
create policy social_post_hashtags_insert_own_post
  on public.social_post_hashtags for insert to authenticated
  with check (exists (
    select 1 from public.social_posts p
    where p.id = social_post_hashtags.post_id and p.author_id = (select auth.uid())
  ));
create policy social_post_hashtags_delete_own_post
  on public.social_post_hashtags for delete to authenticated
  using (exists (
    select 1 from public.social_posts p
    where p.id = social_post_hashtags.post_id and p.author_id = (select auth.uid())
  ));

-- Bookmarks are private and cannot be accessed by anonymous callers.
revoke all on table public.social_bookmarks from public, anon, authenticated;
grant select, insert, delete on table public.social_bookmarks to authenticated;
drop policy if exists social_bookmarks_write on public.social_bookmarks;
create policy social_bookmarks_select_own
  on public.social_bookmarks for select to authenticated
  using (user_id = (select auth.uid()));
create policy social_bookmarks_insert_own
  on public.social_bookmarks for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy social_bookmarks_delete_own
  on public.social_bookmarks for delete to authenticated
  using (user_id = (select auth.uid()));

-- Share records are public metadata, but only authenticated users can create/remove their own.
revoke all on table public.social_post_shares from public, anon, authenticated;
grant select on table public.social_post_shares to anon, authenticated;
grant insert (post_id, user_id) on table public.social_post_shares to authenticated;
grant delete on table public.social_post_shares to authenticated;
drop policy if exists social_post_shares_public on public.social_post_shares;
drop policy if exists social_post_shares_insert on public.social_post_shares;
drop policy if exists social_post_shares_delete on public.social_post_shares;
create policy social_post_shares_public
  on public.social_post_shares for select to anon, authenticated using (true);
create policy social_post_shares_insert
  on public.social_post_shares for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy social_post_shares_delete
  on public.social_post_shares for delete to authenticated
  using (user_id = (select auth.uid()));

-- Live recordings are private to their owner and clients may only create/update supported fields.
revoke all on table public.social_live_recordings from public, anon, authenticated;
grant select on table public.social_live_recordings to authenticated;
grant insert (live_stream_id, owner_user_id, title, storage_path, media_url, media_type, duration_seconds, status)
  on table public.social_live_recordings to authenticated;
grant update (status, published_post_id) on table public.social_live_recordings to authenticated;
drop policy if exists "live recordings owner insert" on public.social_live_recordings;
drop policy if exists "live recordings owner read" on public.social_live_recordings;
drop policy if exists "live recordings owner update" on public.social_live_recordings;
create policy social_live_recordings_owner_insert
  on public.social_live_recordings for insert to authenticated
  with check (owner_user_id = (select auth.uid()));
create policy social_live_recordings_owner_read
  on public.social_live_recordings for select to authenticated
  using (owner_user_id = (select auth.uid()));
create policy social_live_recordings_owner_update
  on public.social_live_recordings for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

-- Live chat and reactions follow the same visibility rules as the live stream itself.
revoke all on table public.social_live_comments from public, anon, authenticated;
grant select on table public.social_live_comments to anon, authenticated;
grant insert (live_id, user_id, content) on table public.social_live_comments to authenticated;
grant delete on table public.social_live_comments to authenticated;
drop policy if exists "Authenticated users can comment on lives" on public.social_live_comments;
drop policy if exists "Users can delete own live comments" on public.social_live_comments;
drop policy if exists "Users can view live comments" on public.social_live_comments;
create policy social_live_comments_visible
  on public.social_live_comments for select to anon, authenticated
  using (exists (select 1 from public.social_live_streams l where l.id = social_live_comments.live_id));
create policy social_live_comments_insert
  on public.social_live_comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.social_live_streams l where l.id = social_live_comments.live_id)
  );
create policy social_live_comments_delete
  on public.social_live_comments for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.social_live_reactions from public, anon, authenticated;
grant select on table public.social_live_reactions to anon, authenticated;
grant insert (live_id, user_id, reaction) on table public.social_live_reactions to authenticated;
grant delete on table public.social_live_reactions to authenticated;
drop policy if exists "Authenticated users can react to lives" on public.social_live_reactions;
drop policy if exists "Users can delete own live reactions" on public.social_live_reactions;
drop policy if exists "Users can view live reactions" on public.social_live_reactions;
create policy social_live_reactions_visible
  on public.social_live_reactions for select to anon, authenticated
  using (exists (select 1 from public.social_live_streams l where l.id = social_live_reactions.live_id));
create policy social_live_reactions_insert
  on public.social_live_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.social_live_streams l where l.id = social_live_reactions.live_id)
  );
create policy social_live_reactions_delete
  on public.social_live_reactions for delete to authenticated
  using (user_id = (select auth.uid()));
