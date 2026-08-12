-- Fuzzy song-name matching via pg_trgm, exposed as an RPC so the
-- Supabase JS client can call it through PostgREST.

create or replace function match_songs(
  search_name text,
  match_threshold float default 0.4,
  match_count int default 5
)
returns table (
  id uuid,
  canonical_name text,
  similarity float
)
language sql
stable
as $$
  select
    songs.id,
    songs.canonical_name,
    similarity(songs.canonical_name, search_name) as similarity
  from songs
  where similarity(songs.canonical_name, search_name) > match_threshold
  order by similarity desc
  limit match_count;
$$;

grant execute on function match_songs(text, float, int) to anon, authenticated;
