import { wordsOf, wordOverlapRatio } from "./normalize";
import { COVER_SIGNAL_KEYWORDS } from "./filter";

// Heuristic only, per the plan. Handles the three patterns it names:
// "Song - Artist Cover", "Artist - Song (Live)", "Song (Artist Cover)".
// Expect misses on anything more creative than that.

function stripCoverKeywords(segment: string): string {
  let result = segment;
  for (const keyword of COVER_SIGNAL_KEYWORDS) {
    result = result.replace(new RegExp(`\\b${keyword}\\b`, "gi"), "");
  }
  return result.replace(/\s+/g, " ").trim();
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
      const candidate = stripCoverKeywords(second);
      if (candidate) return candidate;
    }
    if (secondIsSong && !firstIsSong) {
      const candidate = stripCoverKeywords(first);
      if (candidate) return candidate;
    }
  }

  const parenMatch = rawTitle.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inner = parenMatch[1];
    const stripped = stripCoverKeywords(inner);
    if (stripped && stripped.toLowerCase() !== inner.toLowerCase()) {
      return stripped;
    }
  }

  return null;
}
