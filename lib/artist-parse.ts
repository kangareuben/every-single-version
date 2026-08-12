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

function stripCoverKeywords(segment: string): string {
  let result = segment;
  for (const keyword of COVER_SIGNAL_KEYWORDS) {
    result = result.replace(new RegExp(`\\b${keyword}\\b`, "gi"), "");
  }
  return result.replace(/\s+/g, " ").trim();
}

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
// stripping, no letters at all, or a single stray character/symbol.
function isPlausibleName(candidate: string): boolean {
  return candidate.length >= 2 && /\p{L}/u.test(candidate);
}

function cleanCandidate(raw: string): string | null {
  const cleaned = stripLeadingFillerWords(
    stripCoverKeywords(stripParentheticals(raw)),
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
