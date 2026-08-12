import { after } from "next/server";
import { supabaseAnon, supabaseService } from "@/lib/supabase";
import { normalize } from "@/lib/normalize";
import { linkArtistToSong } from "@/lib/artists";
import { crawlSong } from "@/lib/crawl";

const STALE_HOURS = 24;

// Safety margin for larger crawls (more results = more DB writes). Hobby
// plan may cap this lower regardless — worth checking the Vercel dashboard
// if new-song searches ever time out in production.
export const maxDuration = 60;

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

  let songId: string;
  let canonicalName: string;
  let isNewSong = false;

  const candidate = candidates?.[0];

  if (candidate) {
    songId = candidate.id;
    canonicalName = candidate.canonical_name;
  } else {
    isNewSong = true;
    const { data: newSong, error: insertSongError } = await supabaseService
      .from("songs")
      .insert({ canonical_name: songQuery.trim() })
      .select("id, canonical_name")
      .single();

    if (insertSongError || !newSong) {
      return Response.json(
        { error: insertSongError?.message ?? "failed to create song" },
        { status: 500 },
      );
    }

    songId = newSong.id;
    canonicalName = newSong.canonical_name;

    try {
      await crawlSong(songId, canonicalName, artistQuery);
    } catch (err) {
      console.error("crawl failed:", err);
      return Response.json(
        {
          status: "crawl_failed",
          songId,
          message: "Something went wrong building this playlist. Try again shortly.",
        },
        { status: 502 },
      );
    }
  }

  const { data: linkedArtists } = await supabaseAnon
    .from("song_artists")
    .select("artists(name)")
    .eq("song_id", songId);

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
    .eq("song_id", songId)
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
  // channel-title fallback, so future searches for them hit directly.
  if (matchedVia === "channel" && artistQuery) {
    await linkArtistToSong(songId, artistQuery.trim());
  }

  let stale = false;
  if (!isNewSong) {
    const { data: songRow } = await supabaseAnon
      .from("songs")
      .select("last_crawled_at")
      .eq("id", songId)
      .single();

    stale = songRow?.last_crawled_at
      ? Date.now() - new Date(songRow.last_crawled_at).getTime() >
        STALE_HOURS * 60 * 60 * 1000
      : true;

    if (stale) {
      // Serve the cached playlist immediately, re-crawl in the background.
      after(() =>
        crawlSong(songId, canonicalName, artistQuery).catch((err) =>
          console.error("background re-crawl failed:", err),
        ),
      );
    }
  }

  return Response.json({
    status: isNewSong ? "new_song_crawled" : "cache_hit",
    songId,
    canonicalName,
    artistConfirmed,
    stale,
    videos,
  });
}
