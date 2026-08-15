import { supabaseAnon } from "@/lib/supabase";

const RESULT_LIMIT = 100;

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
    const { data, error } = await supabaseAnon
      .from("songs")
      .select(SELECT)
      .limit(RESULT_LIMIT * 2); // headroom for the zero-video filter below

    if (error) return Response.json({ error: error.message }, { status: 500 });
    const songs = (data as unknown as SongRow[])
      .map(toEntry)
      .filter(hasVideos)
      .sort(byPrimaryArtist)
      .slice(0, RESULT_LIMIT);
    return Response.json({ songs });
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

  const songs = [...merged.values()]
    .map(toEntry)
    .filter(hasVideos)
    .sort(byPrimaryArtist)
    .slice(0, RESULT_LIMIT);

  return Response.json({ songs });
}
