-- Safe migration: add comments table if missing. No drops.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  name text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_comments_episode_id on public.comments(episode_id);

alter table public.comments enable row level security;

do $$ begin
  create policy "Public comments are viewable by everyone"
    on public.comments for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can insert comments"
    on public.comments for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can update comments"
    on public.comments for update using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can delete comments"
    on public.comments for delete using (true);
exception when duplicate_object then null; end $$;
