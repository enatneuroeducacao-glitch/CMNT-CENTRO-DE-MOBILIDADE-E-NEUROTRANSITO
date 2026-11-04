-- Pinning for social posts. Additive migration: preserves all existing posts.
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS social_posts_pinned_created_at_idx
  ON public.social_posts (is_pinned DESC, created_at DESC);
