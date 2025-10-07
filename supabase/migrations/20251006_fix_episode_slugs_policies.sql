-- Fix policies for episode_slugs using idempotent DO blocks

-- Ensure RLS is enabled (safe if already on)
alter table if exists public.episode_slugs enable row level security;

-- Public read
do $$ begin
  create policy "Public slugs are viewable by everyone"
    on public.episode_slugs for select using (true);
exception when duplicate_object then null; end $$;

-- Open insert
do $$ begin
  create policy "Anyone can insert slugs"
    on public.episode_slugs for insert with check (true);
exception when duplicate_object then null; end $$;

-- Open delete
do $$ begin
  create policy "Anyone can delete slugs"
    on public.episode_slugs for delete using (true);
exception when duplicate_object then null; end $$;
