import { parseArtistFromTitle } from "./artist-parse";
import { isCloseMatch, normalizeCompact, wordsOf } from "./normalize";
import { COVER_SIGNAL_KEYWORDS } from "./filter";

export type VersionClassification = "original" | "cover" | "unknown";

export interface ClassifiableVideo {
  title: string;
  channelTitle: string | null;
}

// isCloseMatch alone is edit-distance based (tolerant of a typo, not of a
// different length) — "Jimi Hendrix" vs "The Jimi Hendrix Experience" fails
// it despite being the same act, which would wrongly classify the artist's
// own billing as a cover of themselves. Word-set containment catches that,
// but only above a 2-word floor — "Queen" is a 1-word subset of "Queen
// Latifah" too, which isn't the same artist at all (same false-match risk
// as every other single-common-word containment check in this codebase).
function sameArtist(a: string, b: string): boolean {
  if (isCloseMatch(a, b)) return true;
  const aWords = new Set(wordsOf(a));
  const bWords = new Set(wordsOf(b));
  const [shorter, longer] = aWords.size <= bWords.size ? [aWords, bWords] : [bWords, aWords];
  if (shorter.size < 2) return false;
  return [...shorter].every((w) => longer.has(w));
}

// Same channel-title fallback technique used in lib/crawl.ts and
// lib/filter.ts (word-phrase match, plus a normalizeCompact fallback for
// spacing-insensitive initials like "A.R." vs "A. R.") — see normalize.ts's
// own comment for why the compact fallback is needed at all.
function channelMatchesArtist(channelTitle: string | null, searchedArtist: string): boolean {
  if (!channelTitle) return false;
  const channelWords = wordsOf(channelTitle).join(" ");
  const artistWords = wordsOf(searchedArtist).join(" ");
  if (artistWords && channelWords.includes(artistWords)) return true;
  return normalizeCompact(channelTitle).includes(normalizeCompact(searchedArtist));
}

// Best-effort, per-song classification — deliberately NOT the same kind of
// catalog-wide heuristic sweep that proved unsafe earlier (see memory on
// the abandoned junk-artist sweep): this only ever looks at one song's own
// video list, scoped to a single already-confirmed searchedArtist, which
// is a much narrower and lower-risk judgment than guessing across the
// whole catalog with no context.
export function classifyVersion(
  video: ClassifiableVideo,
  songName: string,
  searchedArtist: string,
): VersionClassification {
  const parsedArtist = parseArtistFromTitle(video.title, songName);
  if (parsedArtist) {
    return sameArtist(parsedArtist, searchedArtist) ? "original" : "cover";
  }

  if (channelMatchesArtist(video.channelTitle, searchedArtist)) return "original";

  const lowerTitle = video.title.toLowerCase();
  if (COVER_SIGNAL_KEYWORDS.some((keyword) => lowerTitle.includes(keyword))) return "cover";

  return "unknown";
}

// Breaks up the "first page looks identical to a plain YouTube search"
// problem: the base query (bare "song artist", the same thing YouTube's
// own search box runs) gets merged into the DB first, and with no ORDER
// BY on fetch, those tend to surface first in the list. Round-robins
// across classification buckets — covers first in the cycle, so they get
// priority slots even when outnumbered — instead of changing anything
// about how results are stored or queried.
export function interleaveByClassification<T extends { classification: VersionClassification }>(
  items: T[],
): T[] {
  const buckets: Record<VersionClassification, T[]> = { original: [], cover: [], unknown: [] };
  for (const item of items) buckets[item.classification].push(item);

  const cycle: VersionClassification[] = ["cover", "original", "unknown"];
  const result: T[] = [];
  let remaining = items.length;
  while (remaining > 0) {
    for (const key of cycle) {
      const bucket = buckets[key];
      if (bucket.length > 0) {
        result.push(bucket.shift()!);
        remaining--;
      }
    }
  }
  return result;
}
