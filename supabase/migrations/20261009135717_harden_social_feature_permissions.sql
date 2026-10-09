-- Restrict social profile writes to ordinary profile fields.
revoke all on table public.social_profiles from public, anon, authenticated;
grant select on table public.social_profiles to anon, authenticated;
grant insert (id, username, display_name, bio, city, state, avatar_url, cover_url, updated_at)
  on table public.social_profiles to authenticated;
grant update (id, username, display_name, bio, city, state, avatar_url, cover_url, updated_at)
  on table public.social_profiles to authenticated;

drop policy if exists social_profiles_self_insert on public.social_profiles;
create policy social_profiles_self_insert
  on public.social_profiles for insert to authenticated
  with check ((select auth.uid()) = id);
drop policy if exists social_profiles_self_update on public.social_profiles;
create policy social_profiles_self_update
  on public.social_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Posts: clients cannot self-assign scientific verification fields.
revoke all on table public.social_posts from public, anon, authenticated;
grant select on table public.social_posts to anon, authenticated;
grant insert (author_id, content, media_url, media_type, location)
  on table public.social_posts to authenticated;
grant update (content) on table public.social_posts to authenticated;
grant delete on table public.social_posts to authenticated;

drop policy if exists social_posts_public on public.social_posts;
create policy social_posts_public
  on public.social_posts for select to anon, authenticated
  using (visibility = 'public' or author_id = (select auth.uid()));
drop policy if exists social_posts_insert on public.social_posts;
create policy social_posts_insert
  on public.social_posts for insert to authenticated
  with check (author_id = (select auth.uid()));
drop policy if exists social_posts_update on public.social_posts;
create policy social_posts_update
  on public.social_posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
drop policy if exists social_posts_delete on public.social_posts;
create policy social_posts_delete
  on public.social_posts for delete to authenticated
  using (author_id = (select auth.uid()));

-- Comments inherit the visibility of their parent post.
revoke all on table public.social_comments from public, anon, authenticated;
grant select on table public.social_comments to anon, authenticated;
grant insert (post_id, author_id, content) on table public.social_comments to authenticated;
grant update (content) on table public.social_comments to authenticated;
grant delete on table public.social_comments to authenticated;

drop policy if exists social_comments_public on public.social_comments;
create policy social_comments_visible
  on public.social_comments for select to anon, authenticated
  using (exists (
    select 1 from public.social_posts p
    where p.id = social_comments.post_id
      and (p.visibility = 'public' or p.author_id = (select auth.uid()))
  ));
drop policy if exists social_comments_insert on public.social_comments;
create policy social_comments_insert
  on public.social_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.social_posts p
      where p.id = social_comments.post_id
        and (p.visibility = 'public' or p.author_id = (select auth.uid()))
    )
  );
drop policy if exists social_comments_update on public.social_comments;
create policy social_comments_update
  on public.social_comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
drop policy if exists social_comments_delete on public.social_comments;
create policy social_comments_delete
  on public.social_comments for delete to authenticated
  using (author_id = (select auth.uid()));

-- Reactions and follows are append/remove operations; no client-side row reassignment.
revoke all on table public.social_reactions from public, anon, authenticated;
grant select on table public.social_reactions to anon, authenticated;
grant insert (post_id, user_id, reaction) on table public.social_reactions to authenticated;
grant delete on table public.social_reactions to authenticated;
drop policy if exists social_reactions_public on public.social_reactions;
create policy social_reactions_public
  on public.social_reactions for select to anon, authenticated using (true);
drop policy if exists social_reactions_write on public.social_reactions;
create policy social_reactions_insert_self
  on public.social_reactions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy social_reactions_delete_self
  on public.social_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.social_follows from public, anon, authenticated;
grant select on table public.social_follows to anon, authenticated;
grant insert (follower_id, following_id) on table public.social_follows to authenticated;
grant delete on table public.social_follows to authenticated;
drop policy if exists social_follows_public on public.social_follows;
create policy social_follows_public
  on public.social_follows for select to anon, authenticated using (true);
drop policy if exists social_follows_write on public.social_follows;
create policy social_follows_insert_self
  on public.social_follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and follower_id <> following_id);
create policy social_follows_delete_self
  on public.social_follows for delete to authenticated
  using (follower_id = (select auth.uid()));

-- Community membership role is assigned by the database default, not by clients.
revoke all on table public.social_community_members from public, anon, authenticated;
grant select on table public.social_community_members to anon, authenticated;
grant insert (community_id, user_id) on table public.social_community_members to authenticated;
grant delete on table public.social_community_members to authenticated;
drop policy if exists social_members_public on public.social_community_members;
create policy social_members_public
  on public.social_community_members for select to anon, authenticated using (true);
drop policy if exists social_members_write on public.social_community_members;
create policy social_members_insert_self
  on public.social_community_members for insert to authenticated
  with check (user_id = (select auth.uid()) and role = 'member');
create policy social_members_delete_self
  on public.social_community_members for delete to authenticated
  using (user_id = (select auth.uid()));

-- Communities can be created with user-editable fields only; governance settings stay server-controlled.
revoke all on table public.social_communities from public, anon, authenticated;
grant select on table public.social_communities to anon, authenticated;
grant insert (name, slug, description, category, created_by)
  on table public.social_communities to authenticated;
drop policy if exists social_communities_public on public.social_communities;
create policy social_communities_public
  on public.social_communities for select to anon, authenticated using (true);
drop policy if exists social_communities_insert on public.social_communities;
create policy social_communities_insert
  on public.social_communities for insert to authenticated
  with check (created_by = (select auth.uid()));

-- Notifications must identify the authenticated actor; recipients alone can read or mark read.
revoke all on table public.social_notifications from public, anon, authenticated;
grant select on table public.social_notifications to authenticated;
grant insert (user_id, actor_id, type, post_id, message)
  on table public.social_notifications to authenticated;
grant update (read_at) on table public.social_notifications to authenticated;
drop policy if exists social_notifications_read on public.social_notifications;
create policy social_notifications_read
  on public.social_notifications for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists social_notifications_insert on public.social_notifications;
create policy social_notifications_insert
  on public.social_notifications for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and user_id <> (select auth.uid())
    and type in ('like', 'comment', 'message', 'follow')
  );
drop policy if exists social_notifications_update on public.social_notifications;
create policy social_notifications_update
  on public.social_notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Live streams respect public/follower/community visibility; remove permissive duplicates.
revoke all on table public.social_live_streams from public, anon, authenticated;
grant select on table public.social_live_streams to anon, authenticated;
grant insert (host_user_id, title, description, category, visibility, community_id, status,
              scheduled_at, theme, presenter_names, guest_mentions, publish_to_feed)
  on table public.social_live_streams to authenticated;
grant update (status, started_at, ended_at, viewer_count, feed_post_id)
  on table public.social_live_streams to authenticated;
grant delete on table public.social_live_streams to authenticated;

drop policy if exists "Public can view public lives" on public.social_live_streams;
drop policy if exists "Hosts can create lives" on public.social_live_streams;
drop policy if exists "Hosts can update lives" on public.social_live_streams;
drop policy if exists "live public read" on public.social_live_streams;
drop policy if exists "live host insert" on public.social_live_streams;
drop policy if exists "live host update" on public.social_live_streams;
drop policy if exists "live host delete" on public.social_live_streams;

create policy social_live_streams_select_visible
  on public.social_live_streams for select to anon, authenticated
  using (
    visibility = 'public'
    or host_user_id = (select auth.uid())
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.social_follows f
        where f.follower_id = (select auth.uid())
          and f.following_id = social_live_streams.host_user_id
      )
    )
    or (
      visibility = 'community'
      and community_id is not null
      and exists (
        select 1 from public.social_community_members m
        where m.community_id = social_live_streams.community_id
          and m.user_id = (select auth.uid())
      )
    )
  );
create policy social_live_streams_insert_host
  on public.social_live_streams for insert to authenticated
  with check (host_user_id = (select auth.uid()));
create policy social_live_streams_update_host
  on public.social_live_streams for update to authenticated
  using (host_user_id = (select auth.uid()))
  with check (host_user_id = (select auth.uid()));
create policy social_live_streams_delete_host
  on public.social_live_streams for delete to authenticated
  using (host_user_id = (select auth.uid()));
