-- Adds a real "primary artist" concept to songs, distinct from
-- song_artists (which links every artist name ever parsed out of a
-- crawled video's title — useful for search-artist confirmation, too
-- noisy for display). Run once in Supabase SQL Editor.
--
-- Existing songs are not backfilled: the artist originally searched for
-- was never persisted, so there's nothing to backfill from. They'll get
-- a primary_artist_id the next time they're searched with an artist
-- (either as a new song, or via the channel-title confirmation fallback
-- in app/api/search/route.ts).

alter table songs add column primary_artist_id uuid references artists(id);

create index songs_primary_artist_id_idx on songs (primary_artist_id);
