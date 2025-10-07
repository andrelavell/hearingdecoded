-- Safe migration: add episode_number to episodes
alter table if exists public.episodes
  add column if not exists episode_number integer;
