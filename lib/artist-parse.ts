import { wordsOf, wordOverlapRatio } from "./normalize";
import { COVER_SIGNAL_KEYWORDS } from "./filter";

// Heuristic only, per the plan. Handles the three patterns it names:
// "Song - Artist Cover", "Artist - Song (Live)", "Song (Artist Cover)".
// Expect misses on anything more creative than that.

// Words that commonly precede a name in a title ("cover by Sally Kim",
// "Radiohead - Creep [live in Milan]") but aren't part of the name itself.
const LEADING_FILLER_WORDS = [
  "by",
  "ft",
  "feat",
  "featuring",
  "performed",
  "in",
  "at",
  "on",
  "of",
  "for",
  "from",
  "with",
];

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
// "From Norwich / 1998"), or implausibly long (real artist names are
// rarely more than a few words; a longer survivor is almost always a
// run-on descriptive phrase that slipped past the other checks).
function isPlausibleName(candidate: string): boolean {
  if (candidate.length < 2 || !/\p{L}/u.test(candidate)) return false;
  if (candidate.includes("/")) return false;
  if (candidate.split(" ").filter(Boolean).length > MAX_CANDIDATE_WORDS) return false;
  return true;
}

function cleanCandidate(raw: string): string | null {
  const cleaned = stripLeadingFillerWords(
    truncateAtContextWord(
      preferAfterBy(stripDescriptorKeywords(stripParentheticals(raw))),
    ),
  );
  return isPlausibleName(cleaned) ? cleaned : null;
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
        const candidate = cleanCandidate(segments[i]);
        if (candidate) return candidate;
      }
    }
  }

  const parenMatch = rawTitle.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inner = parenMatch[1];
    const candidate = cleanCandidate(inner);
    if (candidate && candidate.toLowerCase() !== inner.toLowerCase()) {
      return candidate;
    }
  }

  return null;
}
