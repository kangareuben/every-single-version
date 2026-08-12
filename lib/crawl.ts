import { supabaseService } from "./supabase";
import { searchVideos, getVideoDetails } from "./youtube";
import { filterResult } from "./filter";
import { parseArtistFromTitle } from "./artist-parse";
import { linkArtistToSong } from "./artists";

const LOCK_STALE_MINUTES = 10;
const MAX_RESULTS = 25;

// Guards against two concurrent crawls of the same song (e.g. two users
// searching the same brand-new song at once). A crawl that crashed
// without clearing its lock is treated as expired after
// LOCK_STALE_MINUTES rather than blocking that song forever.
async function acquireCrawlLock(songId: string): Promise<boolean> {
  const staleBefore = new Date(
    Date.now() - LOCK_STALE_MINUTES * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabaseService
    .from("songs")
    .update({ crawl_locked_at: new Date().toISOString() })
    .eq("id", songId)
    .or(`crawl_locked_at.is.null,crawl_locked_at.lt.${staleBefore}`)
    .select("id");

  if (error) {
    console.error("acquireCrawlLock:", error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

async function releaseCrawlLock(songId: string, markCrawled: boolean) {
  const update: { crawl_locked_at: null; last_crawled_at?: string } = {
    crawl_locked_at: null,
  };
  if (markCrawled) update.last_crawled_at = new Date().toISOString();

  const { error } = await supabaseService
    .from("songs")
    .update(update)
    .eq("id", songId);
  if (error) console.error("releaseCrawlLock:", error);
}

export async function crawlSong(
  songId: string,
  canonicalName: string,
  artistHint: string | null,
): Promise<void> {
  const gotLock = await acquireCrawlLock(songId);
  if (!gotLock) return; // another crawl is already in progress for this song

  let succeeded = false;
  try {
    const query = artistHint ? `${canonicalName} ${artistHint}` : canonicalName;
    const results = await searchVideos(query, MAX_RESULTS);
    const details = await getVideoDetails(results.map((r) => r.videoId));

    for (const result of results) {
      const detail = details.get(result.videoId);
      const filterOutcome = filterResult(canonicalName, artistHint, {
        title: result.title,
        description: result.description,
        durationSeconds: detail?.durationSeconds ?? null,
        categoryId: detail?.categoryId ?? null,
      });

      if (!filterOutcome.pass) continue;

      const { error: insertError } = await supabaseService
        .from("videos")
        .upsert(
          {
            song_id: songId,
            video_id: result.videoId,
            title: result.title,
            channel_title: result.channelTitle,
          },
          { onConflict: "song_id,video_id", ignoreDuplicates: true },
        );
      if (insertError) console.error("crawlSong video insert:", insertError);

      const parsedArtist = parseArtistFromTitle(result.title, canonicalName);
      if (parsedArtist) {
        await linkArtistToSong(songId, parsedArtist);
      }
    }

    if (artistHint) {
      await linkArtistToSong(songId, artistHint);
    }

    succeeded = true;
  } finally {
    await releaseCrawlLock(songId, succeeded);
  }
}
