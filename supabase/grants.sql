-- Table-level SELECT grants for the anon/authenticated Data API roles.
-- RLS policies (already defined) further restrict what's visible; this
-- grants base access so those policies can even take effect. flags is
-- deliberately not granted here: no public access to it at all.

grant select on songs, artists, song_artists, videos to anon, authenticated;

-- service_role bypasses RLS but still needs explicit table grants; it's
-- used server-side for all writes (crawl inserts, artist linking, flags).
grant all on songs, artists, song_artists, videos, flags to service_role;
