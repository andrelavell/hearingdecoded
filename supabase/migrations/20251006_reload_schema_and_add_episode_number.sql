-- Ensure episode_number exists and refresh PostgREST schema cache (idempotent)
begin;
  alter table if exists public.episodes
    add column if not exists episode_number integer;
commit;

-- Reload PostgREST schema cache so new columns are visible immediately
select pg_notify('pgrst', 'reload schema');
