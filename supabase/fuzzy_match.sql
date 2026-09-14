-- Fuzzy song-name matching via pg_trgm, exposed as an RPC so the
-- Supabase JS client can call it through PostgREST.
--
-- Plain similarity() is symmetric and penalizes length differences
-- between the two strings — it compares whole trigram sets, so a much
-- longer string introduces many trigrams the shorter one can't share,
-- diluting the score regardless of whether the shorter string is a
-- clean subset of the longer one. Confirmed on a real duplicate: "green
-- eyes" vs "green eyes and a heart of gold" (same real Lone Bellow
-- song) scored ~0.35, under the 0.4 threshold, so the shorter title
-- never even came back as a candidate for the app's own word-order
-- containment check (isOrderedSubsequenceOf in route.ts) to evaluate —
-- it silently spawned a second entry instead. word_similarity() is
-- pg_trgm's purpose-built answer to this: it scores the first argument
-- against its best-matching substring of the second, so extra trailing
-- content in the longer string doesn't drag the score down. Checked in
-- both directions since either the search term or the stored name could
-- be the longer one.
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
    greatest(
      similarity(songs.canonical_name, search_name),
      word_similarity(songs.canonical_name, search_name),
      word_similarity(search_name, songs.canonical_name)
    ) as similarity
  from songs
  where greatest(
    similarity(songs.canonical_name, search_name),
    word_similarity(songs.canonical_name, search_name),
    word_similarity(search_name, songs.canonical_name)
  ) > match_threshold
  order by similarity desc
  limit match_count;
$$;

grant execute on function match_songs(text, float, int) to anon, authenticated;
