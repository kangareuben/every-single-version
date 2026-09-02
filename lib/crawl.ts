import { supabaseService } from "./supabase";
import { searchVideos, getVideoDetails, type YoutubeSearchResult } from "./youtube";
import { filterResult } from "./filter";
import { parseArtistFromTitle } from "./artist-parse";
import { linkArtistToSong } from "./artists";
import { wordsOf, wordOverlapRatio, hasSignificantWord } from "./normalize";

const LOCK_STALE_MINUTES = 10;
const RESULTS_PER_QUERY = 50; // API max per call; same 100-unit cost regardless
const STRONG_MATCH_THRESHOLD = 0.8;

// One query alone (bare "song artist") strongly over-favors official/popular
// uploads in YouTube's ranking, burying genuine covers past the first page.
// Running these variants and merging results surfaces a much wider pool
// before filtering. Costs ~6x the search.list quota of a single query.
//
// "karaoke" deliberately excluded: karaoke-specialist channels upload
// prolifically (every pitch/key as a separate video), so a dedicated
// karaoke query floods results out of proportion to genuine cover
// diversity — confirmed on "Halo" by Beyoncé, 21 of 67 results (31%)
// were karaoke, several near-duplicates from the same channel in
// different keys. Karaoke videos surfacing via the other queries still
// pass filtering (it remains a cover-signal keyword) but are capped
// below, see KARAOKE_CAP.
const QUERY_KEYWORD_VARIANTS = ["cover", "live", "acoustic", "instrumental"];

const KARAOKE_CAP = 5;
const KARAOKE_PATTERN = /karaoke/i;

export async function fetchBaseQueryResults(
  songName: string,
  artistHint: string | null,
): Promise<YoutubeSearchResult[]> {
  const query = artistHint ? `${songName} ${artistHint}` : songName;
  return searchVideos(query, RESULTS_PER_QUERY);
}

// Guards against generic/obscure searches (e.g. a one-word song title by an
// artist with no real YouTube presence) where per-video filtering is too
// weak on its own — a single common word can satisfy it against totally
// unrelated content. Checked against the TITLE only, not description: the
// description is a much noisier signal (tangential mentions, unrelated
// comparisons) that can pass this check for content about something else
// entirely.
export function hasStrongMatch(
  results: YoutubeSearchResult[],
  songName: string,
  artistHint: string | null,
): boolean {
  const songWords = wordsOf(songName);

  if (!hasSignificantWord(songWords)) {
    // A "song" name made entirely of stopwords (e.g. "The") can never be
    // meaningfully confirmed — nearly any title contains "the". Confirmed
    // on "The" by "The": matched dozens of The The's real discography,
    // since the artist's own name (also all-stopword) trivially supplied
    // a second, independent-looking occurrence of the same word.
    return false;
  }

  const artistWords = artistHint ? wordsOf(artistHint) : [];

  return results.some((result) => {
    const songMatch = wordOverlapRatio(result.title, songWords) >= STRONG_MATCH_THRESHOLD;
    const artistMatch =
      artistWords.length === 0 ||
      wordOverlapRatio(result.title, artistWords) >= STRONG_MATCH_THRESHOLD;
    return songMatch && artistMatch;
  });
}

// Index in `words` where `phrase` first occurs as a contiguous run, or
// null if it doesn't appear as a clean phrase.
function phraseIndex(words: string[], phrase: string[]): number | null {
  if (phrase.length === 0) return null;
  outer: for (let i = 0; i <= words.length - phrase.length; i++) {
    for (let j = 0; j < phrase.length; j++) {
      if (words[i + j] !== phrase[j]) continue outer;
    }
    return i;
  }
  return null;
}

// Counts results whose title has `artistName`'s phrase starting before
// `songName`'s phrase — the "[Artist] - [Song]" convention real
// performance/cover titles almost always follow. hasStrongMatch's bag-of-
// words check can't tell which of two searched terms is actually playing
// which role when a title genuinely contains both (e.g. "Kamelot -
// Forever" satisfies song=Kamelot/artist=Forever exactly as well as the
// reverse), so it independently confirms whichever orientation the user
// typed, silently skipping swap detection. This breaks that tie using
// title order instead of word presence.
export function countArtistBeforeSong(
  results: YoutubeSearchResult[],
  songName: string,
  artistName: string,
): number {
  const songWords = wordsOf(songName);
  const artistWords = wordsOf(artistName);

  return results.filter((result) => {
    const titleWords = wordsOf(result.title);
    const songStart = phraseIndex(titleWords, songWords);
    const artistStart = phraseIndex(titleWords, artistWords);
    return songStart !== null && artistStart !== null && artistStart < songStart;
  }).length;
}

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
  prefetchedBaseResults?: YoutubeSearchResult[],
): Promise<void> {
  const gotLock = await acquireCrawlLock(songId);
  if (!gotLock) return; // another crawl is already in progress for this song

  let succeeded = false;
  try {
    const baseQuery = artistHint
      ? `${canonicalName} ${artistHint}`
      : canonicalName;

    const baseResults =
      prefetchedBaseResults ??
      (await fetchBaseQueryResults(canonicalName, artistHint));

    if (!hasStrongMatch(baseResults, canonicalName, artistHint)) {
      // Nothing in the base query looks like a genuine match — likely an
      // obscure/nonexistent song-artist combo. Abort before spending quota
      // on the keyword-variant queries, and insert nothing so we don't
      // pollute the catalog with loosely-matched noise.
      succeeded = true; // confirmed empty, not a failure
      return;
    }

    const variantBatches = await Promise.all(
      QUERY_KEYWORD_VARIANTS.map((keyword) =>
        searchVideos(`${baseQuery} ${keyword}`, RESULTS_PER_QUERY),
      ),
    );

    const uniqueResults = new Map<string, YoutubeSearchResult>();
    for (const batch of [baseResults, ...variantBatches]) {
      for (const result of batch) {
        if (!uniqueResults.has(result.videoId)) {
          uniqueResults.set(result.videoId, result);
        }
      }
    }

    const results = [...uniqueResults.values()];
    const details = await getVideoDetails(results.map((r) => r.videoId));

    const filteredResults = results.filter((result) => {
      const detail = details.get(result.videoId);
      return filterResult(canonicalName, artistHint, {
        title: result.title,
        description: result.description,
        durationSeconds: detail?.durationSeconds ?? null,
        categoryId: detail?.categoryId ?? null,
      }).pass;
    });

    const karaoke = filteredResults.filter((r) => KARAOKE_PATTERN.test(r.title));
    const nonKaraoke = filteredResults.filter((r) => !KARAOKE_PATTERN.test(r.title));
    const passingResults = [...nonKaraoke, ...karaoke.slice(0, KARAOKE_CAP)];

    if (passingResults.length > 0) {
      const { error: insertError } = await supabaseService.from("videos").upsert(
        passingResults.map((result) => ({
          song_id: songId,
          video_id: result.videoId,
          title: result.title,
          channel_title: result.channelTitle,
        })),
        { onConflict: "song_id,video_id", ignoreDuplicates: true },
      );
      if (insertError) console.error("crawlSong video insert:", insertError);
    }

    const artistNamesToLink = new Set<string>();
    for (const result of passingResults) {
      const parsedArtist = parseArtistFromTitle(result.title, canonicalName);
      if (parsedArtist) artistNamesToLink.add(parsedArtist);
    }
    if (artistHint) artistNamesToLink.add(artistHint);

    await Promise.all(
      [...artistNamesToLink].map((name) => linkArtistToSong(songId, name)),
    );

    succeeded = true;
  } finally {
    await releaseCrawlLock(songId, succeeded);
  }
}
