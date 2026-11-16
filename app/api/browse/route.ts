import { supabaseAnon } from "@/lib/supabase";

const PAGE_SIZE = 100;
// Safety cap on rows fetched before the in-JS filter/sort/paginate below;
// catalog is nowhere near this (under 1000 songs), so this never bites.
const MAX_ROWS = 5000;

function parseOffset(url: URL): number {
  const raw = Number(url.searchParams.get("offset"));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

const SELECT =
  "id, canonical_name, created_at, primary_artist:artists!primary_artist_id(name), song_artists(artists(name)), videos(count)";

// Supabase's structural type inference (no generated Database types wired
// up in lib/supabase.ts) can't resolve embed cardinality — it guessed
// `artists` as an array here, but song_artists -> artists is actually
// to-one at runtime (confirmed: `.map is not a function` when trusting
// that guess). Cast through this manually-verified shape instead of
// fighting the inferred type.
interface SongRow {
  id: string;
  canonical_name: string;
  created_at: string;
  primary_artist: { name: string } | null;
  song_artists: { artists: { name: string } | null }[];
  videos: { count: number }[];
}

interface SongEntry {
  id: string;
  canonicalName: string;
  createdAt: string;
  primaryArtist: string | null;
  artistNames: string[];
  videoCount: number;
}

function toEntry(row: SongRow): SongEntry {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    createdAt: row.created_at,
    primaryArtist: row.primary_artist?.name ?? null,
    artistNames: row.song_artists
      .map((sa) => sa.artists?.name)
      .filter((name): name is string => Boolean(name)),
    videoCount: row.videos[0]?.count ?? 0,
  };
}

// Songs with no surviving videos (crawl found nothing, or everything got
// flagged/hidden) are dead ends in a browse listing — nothing to play.
function hasVideos(entry: SongEntry) {
  return entry.videoCount > 0;
}

// Primary artist first (alphabetical, case-insensitive), songs without
// one (not yet re-searched since the primary_artist_id column was added)
// sorted after those, song name as the final tiebreaker.
function byPrimaryArtist(a: SongEntry, b: SongEntry) {
  if (a.primaryArtist && b.primaryArtist) {
    const cmp = a.primaryArtist.localeCompare(b.primaryArtist, undefined, {
      sensitivity: "base",
    });
    if (cmp !== 0) return cmp;
  } else if (a.primaryArtist || b.primaryArtist) {
    return a.primaryArtist ? -1 : 1;
  }
  return a.canonicalName.localeCompare(b.canonicalName, undefined, { sensitivity: "base" });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  if (!q) {
    const { data, error } = await supabaseAnon.from("songs").select(SELECT).limit(MAX_ROWS);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    const allSongs = (data as unknown as SongRow[])
      .map(toEntry)
      .filter(hasVideos)
      .sort(byPrimaryArtist);
    const offset = parseOffset(url);
    const songs = allSongs.slice(offset, offset + PAGE_SIZE);
    const hasMore = offset + PAGE_SIZE < allSongs.length;
    return Response.json({ songs, hasMore });
  }

  // Song name and artist name live in different tables, so a single query
  // can't search both — run them in parallel and merge by song id.
  const [songNameMatches, artistNameMatches] = await Promise.all([
    supabaseAnon.from("songs").select(SELECT).ilike("canonical_name", `%${q}%`),
    supabaseAnon
      .from("artists")
      .select(`song_artists(songs(${SELECT}))`)
      .ilike("name", `%${q}%`),
  ]);

  if (songNameMatches.error) {
    return Response.json({ error: songNameMatches.error.message }, { status: 500 });
  }
  if (artistNameMatches.error) {
    return Response.json({ error: artistNameMatches.error.message }, { status: 500 });
  }

  const artistMatchRows = artistNameMatches.data as unknown as {
    song_artists: { songs: SongRow | null }[];
  }[];

  const merged = new Map<string, SongRow>();
  for (const row of songNameMatches.data as unknown as SongRow[]) {
    merged.set(row.id, row);
  }
  for (const artist of artistMatchRows) {
    for (const sa of artist.song_artists) {
      if (sa.songs) merged.set(sa.songs.id, sa.songs);
    }
  }

  const allSongs = [...merged.values()].map(toEntry).filter(hasVideos).sort(byPrimaryArtist);
  const offset = parseOffset(url);
  const songs = allSongs.slice(offset, offset + PAGE_SIZE);
  const hasMore = offset + PAGE_SIZE < allSongs.length;

  return Response.json({ songs, hasMore });
}
