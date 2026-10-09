-- These trigger functions only update NEW.updated_at; they need no schema lookup.
-- An empty search_path prevents objects in caller-controlled schemas from shadowing names.
alter function public.social_live_set_updated_at() set search_path = '';
alter function public.set_social_live_stream_updated_at() set search_path = '';
alter function public.set_social_live_recordings_updated_at() set search_path = '';
