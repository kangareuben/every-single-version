import { normalize } from "./normalize";

// Starting point per the plan, not final — tune against real search
// results once the crawl job has run against a variety of songs.
export const COVER_SIGNAL_KEYWORDS = [
  "cover",
  "live",
  "acoustic",
  "instrumental",
  "performs",
  "performance",
  "rendition",
  "unplugged",
  "karaoke",
  "remix",
];

const JUNK_KEYWORDS = [
  "reaction",
  "tutorial",
  "how to play",
  "type beat",
  "review",
  "breakdown",
  "analysis",
];

// Broad on purpose: in practice a title containing "lyrics" almost always
// signals a lyric video, not a genuine performance. Per the plan, this is
// tuned against real results rather than derived up front.
const LYRIC_VIDEO_PATTERN = /\blyrics?\b/i;

const MIN_DURATION_SECONDS = 30;
const MAX_DURATION_SECONDS = 20 * 60;

const MUSIC_CATEGORY_ID = "10";

export function parseIso8601Duration(duration: string): number | null {
  const match = duration.match(
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/,
  );
  if (!match) return null;
  const [, hours, minutes, seconds] = match;
  return (
    (parseInt(hours ?? "0", 10) * 3600) +
    (parseInt(minutes ?? "0", 10) * 60) +
    parseInt(seconds ?? "0", 10)
  );
}

function containsAllWords(haystack: string, needleWords: string[]): boolean {
  const normalizedHaystack = normalize(haystack).toLowerCase();
  return needleWords.every((word) => normalizedHaystack.includes(word));
}

function containsAnyKeyword(haystack: string, keywords: string[]): boolean {
  const lower = haystack.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

export interface FilterCandidate {
  title: string;
  description: string;
  durationSeconds: number | null;
  categoryId: string | null;
}

export interface FilterResult {
  pass: boolean;
  reason?: string;
  isMusicCategory: boolean;
}

export function filterResult(
  songName: string,
  artistName: string | null,
  candidate: FilterCandidate,
): FilterResult {
  const text = `${candidate.title} ${candidate.description}`;
  const isMusicCategory = candidate.categoryId === MUSIC_CATEGORY_ID;

  if (LYRIC_VIDEO_PATTERN.test(candidate.title)) {
    return { pass: false, reason: "lyric video", isMusicCategory };
  }

  if (containsAnyKeyword(text, JUNK_KEYWORDS)) {
    return { pass: false, reason: "junk keyword", isMusicCategory };
  }

  if (
    candidate.durationSeconds !== null &&
    (candidate.durationSeconds < MIN_DURATION_SECONDS ||
      candidate.durationSeconds > MAX_DURATION_SECONDS)
  ) {
    return { pass: false, reason: "duration out of range", isMusicCategory };
  }

  const songWords = normalize(songName).toLowerCase().split(" ").filter(Boolean);
  if (!containsAllWords(text, songWords)) {
    return { pass: false, reason: "song name not found", isMusicCategory };
  }

  // The original studio upload (matches song + artist, no cover-signal
  // keyword needed) counts as a version too, not just covers/live/etc.
  const artistWords = artistName
    ? normalize(artistName).toLowerCase().split(" ").filter(Boolean)
    : [];
  const isPlausibleOriginal =
    artistWords.length > 0 && containsAllWords(text, artistWords);
  const hasCoverSignal = containsAnyKeyword(text, COVER_SIGNAL_KEYWORDS);

  if (!isPlausibleOriginal && !hasCoverSignal) {
    return {
      pass: false,
      reason: "no cover signal and no artist match",
      isMusicCategory,
    };
  }

  return { pass: true, isMusicCategory };
}
