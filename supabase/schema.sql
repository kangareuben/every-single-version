-- EverySingleVersion schema
-- Run once in Supabase SQL Editor (or via `supabase db push`)

create extension if not exists pg_trgm;
create extension if not exists pgcrypto; -- gen_random_uuid()

create table songs (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  created_at timestamptz not null default now(),
  last_crawled_at timestamptz,
  crawl_locked_at timestamptz -- set while a crawl is in progress, cleared after; guards concurrent crawls of the same song
);

create table artists (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table song_artists (
  song_id uuid not null references songs(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  primary key (song_id, artist_id)
);

create table videos (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  video_id text not null,
  title text,
  channel_title text,
  added_at timestamptz not null default now(),
  flag_count int not null default 0,
  hidden boolean not null default false, -- soft-hide once flag_count crosses threshold
  unique (song_id, video_id)
);

create table flags (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index songs_canonical_name_trgm_idx on songs using gin (canonical_name gin_trgm_ops);
create index videos_channel_title_idx on videos (channel_title);
create index videos_song_id_idx on videos (song_id);
create index flags_video_id_idx on flags (video_id);
create index flags_ip_hash_idx on flags (ip_hash);

-- Row-level security: public reads via anon key, all writes go through
-- server routes using the service role key (which bypasses RLS), so no
-- insert/update/delete policies are defined for the anon role.
alter table songs enable row level security;
alter table artists enable row level security;
alter table song_artists enable row level security;
alter table videos enable row level security;
alter table flags enable row level security;

create policy "songs are publicly readable" on songs for select using (true);
create policy "artists are publicly readable" on artists for select using (true);
create policy "song_artists are publicly readable" on song_artists for select using (true);
create policy "non-hidden videos are publicly readable" on videos for select using (not hidden);
-- flags table has no public policy: not readable or writable via anon key
