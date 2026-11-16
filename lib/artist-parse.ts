import { wordsOf, wordOverlapRatio } from "./normalize";
import { COVER_SIGNAL_KEYWORDS } from "./filter";

// Heuristic only, per the plan. Handles the three patterns it names:
// "Song - Artist Cover", "Artist - Song (Live)", "Song (Artist Cover)".
// Expect misses on anything more creative than that.

// Words that reliably introduce a name right after them ("cover by Sally
// Kim", "feat. Otis Taylor", German "Cover von Otis Taylor") — safe to
// strip and trust whatever follows as the name itself.
const LEADING_FILLER_WORDS = ["by", "ft", "feat", "featuring", "performed", "von"];

// Words that almost always introduce a PLACE or EVENT, not a name — unlike
// the words above, stripping these and trusting the remainder is wrong far
// more often than right, so a *leading* occurrence disqualifies the whole
// candidate instead (see isPlausibleName). Confirmed leaking venue/show
// text in whole as "artist" names on real "Hey Joe" uploads: "Live At
// Monterey", "Live At Berkeley - 2nd Show, 10PM", "Live At The Isle Of
// Wight", "Live At Winterland, San Francisco, CA", "Live at SPACE,
// Evanston, Illinois".
const LEADING_CONTEXT_WORDS = ["at", "on", "in", "from", "with", "of", "for"];

function stripParentheticals(segment: string): string {
  return segment.replace(/\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "");
}

// Words that describe a video's format/content, never an artist's own
// name — distinct from COVER_SIGNAL_KEYWORDS's job (flagging a video as
// cover-like for filtering) since here they're pure noise to delete.
// Confirmed on real titles: "Pink Floyd Guitar Solo" and "Guitar Lesson"
// both leaked verbatim into song_artists as "artist" names before these
// were stripped.
const DESCRIPTOR_WORDS = [
  "version",
  "solo",
  "lesson",
  "tutorial",
  "guitar",
  "piano",
  "drum",
  "drums",
  "bass",
  "vocal",
  "vocals",
  "demo",
  "tab",
  "tabs",
  "riff",
];

function stripDescriptorKeywords(segment: string): string {
  let result = segment;
  for (const keyword of [...COVER_SIGNAL_KEYWORDS, ...DESCRIPTOR_WORDS]) {
    result = result.replace(new RegExp(`\\b${keyword}\\b`, "gi"), "");
  }
  return result.replace(/\s+/g, " ").trim();
}

// "X cover by Y" / "X performed by Y" names the actual performer AFTER
// "by", not before — confirmed on "Shine On You Crazy Diamond (Pink
// Floyd cover by Alexa Melo)": the real cover artist is Alexa Melo, but
// without this the whole "Pink Floyd by Alexa Melo" blob was kept.
function preferAfterBy(segment: string): string {
  const match = segment.match(/\bby\b/i);
  if (!match || match.index === undefined) return segment;
  return segment.slice(match.index + match[0].length).trim();
}

// A trailing "at <venue>", "on <tour/date>", "in <place>", "from
// <event>", or "with <someone>" clause describes the recording's
// context, not the artist's name — confirmed on "Pink Floyd at London
// Earls Court" (a live-recording venue credit) and "Not2Series on
// Sessions Halloween Special" (an event name), both of which leaked in
// whole as "artist" names. Only a non-leading match counts: a name that
// itself starts with one of these words (e.g. "At the Drive-In") is
// handled by stripLeadingFillerWords below instead of being cut open.
const TRAILING_CONTEXT_PATTERN = /\b(at|on|in|from|with)\b/i;
function truncateAtContextWord(segment: string): string {
  const match = segment.match(TRAILING_CONTEXT_PATTERN);
  if (!match || match.index === undefined || match.index === 0) return segment;
  return segment.slice(0, match.index).trim();
}

const MAX_CANDIDATE_WORDS = 5;

function stripLeadingFillerWords(segment: string): string {
  let result = segment.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const filler of LEADING_FILLER_WORDS) {
      const pattern = new RegExp(`^${filler}\\b`, "i");
      if (pattern.test(result)) {
        result = result.replace(pattern, "").trim();
        changed = true;
      }
    }
  }
  return result;
}

// Rejects candidates too mangled to plausibly be a name — empty after
// stripping, no letters at all, a single stray character/symbol, a
// "/"-delimited metadata blob (dates, event listings — e.g. "11/4/17" or
// "From Norwich / 1998"), implausibly long (real artist names are rarely
// more than a few words; a longer survivor is almost always a run-on
// descriptive phrase that slipped past the other checks), led by one of
// LEADING_CONTEXT_WORDS (truncateAtContextWord deliberately leaves a
// *leading* occurrence alone — see its comment — so it falls to this
// check instead of being stripped-and-trusted), a standalone 4-digit year
// (not a model number like "Blink-182" — confirmed on "12 Marzo 2012
// @ClockTowerPub" and "Otis Taylor ... New York CIty 2013"), or so
// overlapping with the song's own name that it's clearly a repeat of the
// title (an album/opus name, not an artist — confirmed on "Hey Joe Opus
// Red Meat"). That last check only fires once every word of a multi-word
// song name shows up in the candidate — a single shared word (e.g. "Joe"
// in both "Hey Joe" and "Joe Cocker & Otis Taylor") is just a coincidence.
function isPlausibleName(candidate: string, songWords: string[]): boolean {
  if (candidate.length < 2 || !/\p{L}/u.test(candidate)) return false;
  if (candidate.includes("/")) return false;
  const words = candidate.split(" ").filter(Boolean);
  if (words.length > MAX_CANDIDATE_WORDS) return false;
  if (LEADING_CONTEXT_WORDS.includes(words[0].toLowerCase())) return false;
  if (words.some((w) => /^(19|20)\d{2}$/.test(w))) return false;
  const candidateWords = wordsOf(candidate);
  if (songWords.length > 1 && songWords.every((w) => candidateWords.includes(w))) return false;
  return true;
}

function cleanCandidate(raw: string, songWords: string[]): string | null {
  const cleaned = stripLeadingFillerWords(
    truncateAtContextWord(
      preferAfterBy(stripDescriptorKeywords(stripParentheticals(raw))),
    ),
  );
  return isPlausibleName(cleaned, songWords) ? cleaned : null;
}

// Splits on any dash/pipe separator at once (not one type at a time), so
// titles mixing them ("Radiohead - Creep | PIANO") split into all their
// real segments instead of being skipped because no single separator
// type alone produces exactly two parts.
const SEGMENT_SEPARATOR = / - | – | — | \| /;

export function parseArtistFromTitle(
  rawTitle: string,
  songName: string,
): string | null {
  const songWords = wordsOf(songName);
  // Strip parenthetical/bracket groups before segmenting, not just when
  // cleaning the final candidate — a separator inside one ("Creep (Female
  // Key - Piano)") would otherwise split it open, orphaning the closing
  // bracket onto a different segment than its opener.
  const segments = stripParentheticals(rawTitle)
    .split(SEGMENT_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length >= 2) {
    const songIndex = segments.findIndex(
      (seg) => wordOverlapRatio(seg, songWords) >= 0.6,
    );

    if (songIndex !== -1) {
      // The artist is almost always the segment immediately adjacent to
      // the song segment — trailing segments further out are usually
      // secondary tags ("PIANO", "HD", a channel handle), not the artist.
      // Prefer the segment before, then the segment after.
      const candidateIndexes = [songIndex - 1, songIndex + 1].filter(
        (i) => i >= 0 && i < segments.length,
      );

      for (const i of candidateIndexes) {
        const candidate = cleanCandidate(segments[i], songWords);
        if (candidate) return candidate;
      }
    }
  }

  const parenMatch = rawTitle.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inner = parenMatch[1];
    const candidate = cleanCandidate(inner, songWords);
    if (candidate && candidate.toLowerCase() !== inner.toLowerCase()) {
      return candidate;
    }
  }

  return null;
}
