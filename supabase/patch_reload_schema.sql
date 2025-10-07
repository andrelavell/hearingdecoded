-- Ensure episode_number exists and refresh PostgREST schema cache
begin;
  alter table if exists public.episodes
    add column if not exists episode_number integer;
commit;

-- Ask PostgREST to reload its cached schema so the column is visible immediately
select pg_notify('pgrst', 'reload schema');
