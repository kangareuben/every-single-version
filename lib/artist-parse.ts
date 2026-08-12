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

export function parseArtistFromTitle(
  rawTitle: string,
  songName: string,
): string | null {
  const dashSeparators = [" - ", " – ", " — ", " | "];

  for (const sep of dashSeparators) {
    if (!rawTitle.includes(sep)) continue;
    const parts = rawTitle.split(sep).map((p) => p.trim());
    if (parts.length !== 2) continue;

    const songWords = wordsOf(songName);
    const [first, second] = parts;
    const firstIsSong = wordOverlapRatio(first, songWords) >= 0.6;
    const secondIsSong = wordOverlapRatio(second, songWords) >= 0.6;

    if (firstIsSong && !secondIsSong) {
      const candidate = cleanCandidate(second);
      if (candidate) return candidate;
    }
    if (secondIsSong && !firstIsSong) {
      const candidate = cleanCandidate(first);
      if (candidate) return candidate;
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
