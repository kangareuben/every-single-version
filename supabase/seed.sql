-- Manually-seeded test data for building the search endpoint against,
-- before the crawl job exists. Covers: direct artist match, channel-title
-- fallback match (Pentatonix isn't in song_artists), and a second song to
-- prove fuzzy-match doesn't cross-match.

with hallelujah as (
  insert into songs (canonical_name, last_crawled_at)
  values ('Hallelujah', now())
  returning id
),
cohen as (
  insert into artists (name) values ('Leonard Cohen') returning id
),
link_cohen as (
  insert into song_artists (song_id, artist_id)
  select hallelujah.id, cohen.id from hallelujah, cohen
)
insert into videos (song_id, video_id, title, channel_title)
select hallelujah.id, 'yPI6NNoU3q0', 'Leonard Cohen - Hallelujah', 'Leonard Cohen'
from hallelujah
union all
select hallelujah.id, 'y8AWFf7EAc4', 'Hallelujah (Pentatonix Cover)', 'Pentatonix'
from hallelujah;

with yesterday as (
  insert into songs (canonical_name, last_crawled_at)
  values ('Yesterday', now())
  returning id
),
beatles as (
  insert into artists (name) values ('The Beatles') returning id
),
link_beatles as (
  insert into song_artists (song_id, artist_id)
  select yesterday.id, beatles.id from yesterday, beatles
)
insert into videos (song_id, video_id, title, channel_title)
select yesterday.id, 'jo505ZyaCQ0', 'The Beatles - Yesterday', 'The Beatles'
from yesterday;
