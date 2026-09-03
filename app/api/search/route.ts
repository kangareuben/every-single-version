import { after } from "next/server";
import { supabaseAnon, supabaseService } from "@/lib/supabase";
import { normalize, wordsOf } from "@/lib/normalize";
import { linkArtistToSong } from "@/lib/artists";
import {
  countArtistBeforeSong,
  crawlSong,
  fetchBaseQueryResults,
  hasStrongMatch,
} from "@/lib/crawl";
import type { YoutubeSearchResult } from "@/lib/youtube";

const STALE_HOURS = 24;

// Minimum videos required to trust the swap-tie-break's title-order
// signal (see below) — one coincidental match shouldn't override the
// as-typed reading.
const MIN_ORDER_CONFIRMATIONS = 3;

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

  // A bare song name is too ambiguous for common/short titles to
  // disambiguate — confirmed on "One": Metallica's and U2's versions
  // both passed the no-artist path's weak cover-signal-keyword check,
  // since it has no phrase-proximity confirmation to fall back on the
  // way the with-artist path does.
  if (!artistQuery) {
    return Response.json({ error: "artist is required" }, { status: 400 });
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

  // pg_trgm similarity gives partial credit whenever one string's
  // trigrams are a subset of another's, so a short search term can score
  // above the match threshold against a longer title that merely
  // contains it — "queen" comes back ~46% similar to the already-crawled
  // "killer queen", serving that song's cached (wrong) playlist outright
  // for a "Queen" by "Flash" search, without ever reaching the
  // swap-detection or crawl logic below. A genuine typo/variant of a
  // title has the same word count as the original; a search term that's
  // actually a fragment of a longer title doesn't. Confirmed on "take"
  // (from "take me home, country roads") also wrongly matching the
  // unrelated "take on me".
  const songWordCount = wordsOf(songQuery).length;
  const candidate = candidates?.find(
    (c: { canonical_name: string }) => wordsOf(c.canonical_name).length === songWordCount,
  );

  if (candidate) {
    songId = candidate.id;
    canonicalName = candidate.canonical_name;
  } else {
    // Before committing to this as a new song, check whether the fields
    // might be swapped (song/artist reversed) — e.g. "song=Wu-Tang Clan,
    // artist=Cream" instead of "song=Cream, artist=Wu-Tang Clan". Only
    // costs an extra search.list call when the as-given ordering is
    // already a weak match, so it doesn't add cost to the common case.
    let prefetchedBaseResults: YoutubeSearchResult[] | undefined;

    if (artistQuery) {
      const trimmedSong = songQuery.trim();
      const trimmedArtist = artistQuery.trim();
      const baseResults = await fetchBaseQueryResults(trimmedSong, trimmedArtist);
      const directStrong = hasStrongMatch(baseResults, trimmedSong, trimmedArtist);

      if (!directStrong) {
        const swappedResults = await fetchBaseQueryResults(trimmedArtist, trimmedSong);
        if (hasStrongMatch(swappedResults, trimmedArtist, trimmedSong)) {
          return Response.json({
            status: "possible_swap",
            suggestedSong: trimmedArtist,
            suggestedArtist: trimmedSong,
            message: `Did you mean "${trimmedArtist}" by "${trimmedSong}"?`,
          });
        }
      } else if (hasStrongMatch(baseResults, trimmedArtist, trimmedSong)) {
        // Bag-of-words matching can't tell which searched term is really
        // the artist when a title genuinely contains both — e.g.
        // "Kamelot - Forever" independently confirms song=Kamelot/
        // artist=Forever just as well as the reverse, so the as-typed
        // reading never even reaches the check above. Break the tie with
        // title order ("[Artist] - [Song]"), reusing baseResults so this
        // costs no extra search.list call in the common case where only
        // one orientation is actually strong.
        // Require more than a bare majority of one — a single stray
        // video can independently satisfy both readings by coincidence.
        // Confirmed on "Run" by Run DMC (not a real song): one obscure
        // upload titled "Run from Run DMC feat. Justine Simmons..." had
        // both phrases as genuinely separate, non-overlapping matches,
        // ordered artist-before-song, which alone flipped the tie-break
        // to suggest "Run DMC" by "Run" — equally nonsensical. A genuine
        // swap (Kamelot/Forever) had 36 supporting videos; this had 1.
        const directOrder = countArtistBeforeSong(baseResults, trimmedSong, trimmedArtist);
        const swappedOrder = countArtistBeforeSong(baseResults, trimmedArtist, trimmedSong);
        if (swappedOrder > directOrder && swappedOrder >= MIN_ORDER_CONFIRMATIONS) {
          return Response.json({
            status: "possible_swap",
            suggestedSong: trimmedArtist,
            suggestedArtist: trimmedSong,
            message: `Did you mean "${trimmedArtist}" by "${trimmedSong}"?`,
          });
        }
      }

      prefetchedBaseResults = baseResults;
    }

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

    if (artistQuery) {
      const artistId = await linkArtistToSong(songId, artistQuery.trim());
      if (artistId) {
        await supabaseService
          .from("songs")
          .update({ primary_artist_id: artistId })
          .eq("id", songId);
      }
    }

    try {
      await crawlSong(songId, canonicalName, artistQuery, prefetchedBaseResults);
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
  // Also opportunistically backfills primary_artist_id for songs crawled
  // before that column existed, or created without an artist hint.
  if (matchedVia === "channel" && artistQuery) {
    const artistId = await linkArtistToSong(songId, artistQuery.trim());
    if (artistId) {
      await supabaseService
        .from("songs")
        .update({ primary_artist_id: artistId })
        .eq("id", songId)
        .is("primary_artist_id", null);
    }
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
