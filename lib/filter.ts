import { wordsOf } from "./normalize";

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

// Real performance/cover titles are almost always "[Artist] - [Song]"
// format. A title that opens with a narrative/explainer construction is
// reliably a documentary, "story behind the song", or making-of video —
// confirmed twice now (a Nirvana history video, an "Eric Clapton made
// this song" explainer), both of which otherwise passed every other
// check since they genuinely mention the real song and artist.
const NARRATIVE_TITLE_PATTERN =
  /^(how|why)\b|^the (story|history|truth|making)\b/i;

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

// Word-boundary membership, not substring — a raw `.includes()` check let
// "under" match "underground" as a false hit, and worse, silently
// disabled the proximity/containment checks below (which only run once
// phraseIndex finds the song as a real token), so nothing constrained
// how far the coincidentally-substring-matched "song" was from the
// artist. Confirmed on "Under" by Falconer: "Falconer - Decadence of
// Dignity - live Heidelberg 2004 - Underground Live TV recording" (a
// different real Falconer song entirely) passed purely because "under"
// is a substring of "Underground", the recording venue's name.
function containsAllWords(haystack: string, needleWords: string[]): boolean {
  const haystackWords = new Set(wordsOf(haystack));
  return needleWords.every((word) => haystackWords.has(word));
}

function containsAnyKeyword(haystack: string, keywords: string[]): boolean {
  const lower = haystack.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

// Index in `words` where `phrase` first occurs as a contiguous run, or
// null if it doesn't appear as a clean phrase (only scattered, or absent).
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

// Same as phraseIndex, but skips any match whose span overlaps
// [excludeStart, excludeEnd) — used to find a second, independent
// occurrence that isn't just part of an already-matched phrase.
function phraseIndexOutsideRange(
  words: string[],
  phrase: string[],
  excludeStart: number,
  excludeEnd: number,
): number | null {
  if (phrase.length === 0) return null;
  outer: for (let i = 0; i <= words.length - phrase.length; i++) {
    const end = i + phrase.length;
    if (i < excludeEnd && end > excludeStart) continue;
    for (let j = 0; j < phrase.length; j++) {
      if (words[i + j] !== phrase[j]) continue outer;
    }
    return i;
  }
  return null;
}

const PROXIMITY_SLACK_WORDS = 6;

// True when `songName` and `artistName` both appear as clean phrases in
// `title`, but only because one is entirely nested inside the other with
// no independent, non-overlapping occurrence elsewhere — meaning one of
// them isn't really confirmed on its own, just borrowing the other's
// words. Confirmed in both directions: "Killer Queen" by Queen matched a
// DELTARUNE soundtrack video ("Attack of the Killer Queen") where "Queen"
// only existed inside the song phrase; "Run" by Run DMC matched nearly
// all of Run-DMC's real, unrelated discography ("RUN DMC - It's Tricky",
// "RUN DMC - Walk This Way", ...) where "Run" only existed inside the
// artist's own name.
export function isContainmentArtifact(
  title: string,
  songName: string,
  artistName: string,
): boolean {
  const titleWords = wordsOf(title);
  const songWords = wordsOf(songName);
  const artistWords = wordsOf(artistName);

  const songStart = phraseIndex(titleWords, songWords);
  const artistStart = phraseIndex(titleWords, artistWords);
  if (songStart === null || artistStart === null) return false;

  const songEnd = songStart + songWords.length;
  const artistEnd = artistStart + artistWords.length;
  const artistContainedInSong = artistStart >= songStart && artistEnd <= songEnd;
  const songContainedInArtist = songStart >= artistStart && songEnd <= artistEnd;

  if (artistContainedInSong) {
    return phraseIndexOutsideRange(titleWords, artistWords, songStart, songEnd) === null;
  }
  if (songContainedInArtist) {
    return phraseIndexOutsideRange(titleWords, songWords, artistStart, artistEnd) === null;
  }
  return false;
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

  if (NARRATIVE_TITLE_PATTERN.test(candidate.title.trim())) {
    return { pass: false, reason: "narrative/explainer title", isMusicCategory };
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

  const songWords = wordsOf(songName);

  // Song name (and, below, artist name) must appear in the TITLE, not just
  // the description. Description is a much noisier signal — real videos
  // often mention unrelated songs/artists there in passing (a riff
  // comparison, a "similar artists" blurb), which is enough to falsely
  // satisfy a bag-of-words check against title+description combined.
  if (!containsAllWords(candidate.title, songWords)) {
    return { pass: false, reason: "song name not in title", isMusicCategory };
  }

  const artistWords = artistName ? wordsOf(artistName) : [];

  if (artistWords.length > 0) {
    // Artist must appear as a contiguous phrase, not just each word
    // present anywhere in the title — bag-of-words with .includes()
    // collapses repeated words (e.g. "The The" -> ["the","the"]) down to
    // "does the title contain 'the' even once", which for a common word
    // is satisfied by nearly any English sentence. Confirmed on "Infected"
    // by The The: "The Last of Us: Every Infected Explained!" passed the
    // old check purely because it contains "the" once, nowhere near an
    // actual "The The" mention. Phrase matching also naturally requires
    // the two occurrences to be adjacent, which the old proximity check
    // (word-in-window) didn't enforce.
    const titleWords = wordsOf(candidate.title);
    const artistStart = phraseIndex(titleWords, artistWords);

    if (artistStart === null) {
      return { pass: false, reason: "artist not in title", isMusicCategory };
    }

    // Song and artist both appear as clean phrases, but could still be
    // coincidental — e.g. a product listing mentioning "fluorescent
    // light" and, in an unrelated clause much later, "stars". If the
    // song forms a clean phrase too, require the artist phrase to start
    // reasonably close to it — unless one phrase is just nested inside
    // the other (see isContainmentArtifact), which proximity alone can't
    // catch since a nested phrase is trivially "close" to its container.
    const songStart = phraseIndex(titleWords, songWords);
    if (songStart !== null) {
      if (isContainmentArtifact(candidate.title, songName, artistName!)) {
        return {
          pass: false,
          reason: "song/artist name only present inside the other",
          isMusicCategory,
        };
      }

      const windowStart = Math.max(0, songStart - PROXIMITY_SLACK_WORDS);
      const windowEnd = songStart + songWords.length + PROXIMITY_SLACK_WORDS;
      if (artistStart < windowStart || artistStart >= windowEnd) {
        return {
          pass: false,
          reason: "artist far from song name in title",
          isMusicCategory,
        };
      }
    }
  } else {
    // No artist given — cover-signal keyword is the only signal available
    // besides the song name match already checked above.
    if (!containsAnyKeyword(text, COVER_SIGNAL_KEYWORDS)) {
      return { pass: false, reason: "no cover signal", isMusicCategory };
    }
  }

  // Song and artist can both appear as a clean adjacent phrase by sheer
  // coincidence when they're common words — confirmed on "Cut" by Plumb
  // matching a carpentry video's "5/12 plumb cut" (a framing term).
  // YouTube's own category is a strong tiebreaker here: when it confidently
  // says this isn't music, require a cover-signal keyword as corroboration,
  // same as the no-artist-given case above.
  if (
    candidate.categoryId !== null &&
    !isMusicCategory &&
    !containsAnyKeyword(text, COVER_SIGNAL_KEYWORDS)
  ) {
    return { pass: false, reason: "non-music category, no cover signal", isMusicCategory };
  }

  return { pass: true, isMusicCategory };
}
