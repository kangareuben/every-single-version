import { supabaseAnon, supabaseService } from "@/lib/supabase";

const STALE_HOURS = 24;

function normalize(raw: string): string {
  return raw
    .replace(/\((official|lyric|lyrics|audio|music)[^)]*\)/gi, "")
    .replace(/\[(official|lyric|lyrics|audio|music)[^\]]*\]/gi, "")
    .replace(/\bfeat\.?\b/gi, "")
    .replace(/\bft\.?\b/gi, "")
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function linkArtistToSong(songId: string, artistName: string) {
  const { data: existing, error: lookupError } = await supabaseService
    .from("artists")
    .select("id")
    .ilike("name", artistName)
    .maybeSingle();
  if (lookupError) console.error("linkArtistToSong lookup:", lookupError);

  let artistId = existing?.id as string | undefined;

  if (!artistId) {
    const { data: inserted, error: insertError } = await supabaseService
      .from("artists")
      .insert({ name: artistName })
      .select("id")
      .single();
    if (insertError) console.error("linkArtistToSong insert:", insertError);
    artistId = inserted?.id;
  }

  if (!artistId) return;

  const { error: upsertError } = await supabaseService
    .from("song_artists")
    .upsert(
      { song_id: songId, artist_id: artistId },
      { onConflict: "song_id,artist_id" },
    );
  if (upsertError) console.error("linkArtistToSong upsert:", upsertError);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const songQuery = url.searchParams.get("song");
  const artistQuery = url.searchParams.get("artist");

  if (!songQuery) {
    return Response.json({ error: "song is required" }, { status: 400 });
  }

  const normalizedSong = normalize(songQuery);
  const normalizedArtist = artistQuery ? normalize(artistQuery) : null;

  const { data: candidates, error: matchError } = await supabaseAnon.rpc(
    "match_songs",
    { search_name: normalizedSong },
  );

  if (matchError) {
    return Response.json({ error: matchError.message }, { status: 500 });
  }

  const candidate = candidates?.[0];

  if (!candidate) {
    return Response.json({
      status: "new_song",
      message: "Song not indexed yet. Crawling isn't wired up yet.",
    });
  }

  const { data: linkedArtists } = await supabaseAnon
    .from("song_artists")
    .select("artists(name)")
    .eq("song_id", candidate.id);

  const artistNames = (linkedArtists ?? [])
    .map((row) => (row.artists as unknown as { name: string } | null)?.name)
    .filter((name): name is string => Boolean(name));

  let artistConfirmed = false;
  let matchedVia: "artist" | "channel" | null = null;

  if (normalizedArtist) {
    artistConfirmed = artistNames.some(
      (name) => normalize(name) === normalizedArtist,
    );
    if (artistConfirmed) matchedVia = "artist";
  }

  const { data: videos, error: videosError } = await supabaseAnon
    .from("videos")
    .select("id, video_id, title, channel_title")
    .eq("song_id", candidate.id)
    .eq("hidden", false);

  if (videosError) {
    return Response.json({ error: videosError.message }, { status: 500 });
  }

  if (!artistConfirmed && normalizedArtist) {
    const channelMatch = (videos ?? []).some(
      (v) =>
        v.channel_title && normalize(v.channel_title).includes(normalizedArtist),
    );
    if (channelMatch) {
      artistConfirmed = true;
      matchedVia = "channel";
    }
  }

  // Per plan: link the searched artist to this song whenever confirmed via
  // channel-title fallback, so future searches for that artist hit directly.
  if (matchedVia === "channel" && artistQuery) {
    await linkArtistToSong(candidate.id, artistQuery.trim());
  }

  const { data: songRow } = await supabaseAnon
    .from("songs")
    .select("last_crawled_at")
    .eq("id", candidate.id)
    .single();

  const stale = songRow?.last_crawled_at
    ? Date.now() - new Date(songRow.last_crawled_at).getTime() >
      STALE_HOURS * 60 * 60 * 1000
    : true;

  return Response.json({
    status: "cache_hit",
    songId: candidate.id,
    canonicalName: candidate.canonical_name,
    artistConfirmed,
    stale, // TODO: trigger background re-crawl once the crawl job exists
    videos,
  });
}
