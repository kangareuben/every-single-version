export function normalize(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "Beyoncé" -> "Beyonce"
    .replace(/\((official|lyric|lyrics|audio|music)[^)]*\)/gi, "")
    .replace(/\[(official|lyric|lyrics|audio|music)[^\]]*\]/gi, "")
    .replace(/\bfeat\.?\b/gi, "")
    .replace(/\bft\.?\b/gi, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordsOf(text: string): string[] {
  return normalize(text).toLowerCase().split(" ").filter(Boolean);
}

// Fraction of `words` that appear as whole words somewhere in `text`.
export function wordOverlapRatio(text: string, words: string[]): number {
  if (words.length === 0) return 0;
  const textWords = new Set(wordsOf(text));
  const matches = words.filter((w) => textWords.has(w)).length;
  return matches / words.length;
}

// Common English function words carry no identifying content on their
// own — nearly any sentence contains "the". A "song" or "artist" name
// that's entirely stopwords (e.g. searching "The" by "The") can never be
// meaningfully confirmed against arbitrary title text, no matter how the
// matching logic is tuned.
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "at",
  "is",
  "it",
]);

export function hasSignificantWord(words: string[]): boolean {
  return words.some((w) => !STOPWORDS.has(w));
}

// Damerau-Levenshtein distance (optimal string alignment variant — adjacent
// transpositions count as one edit, which plain Levenshtein doesn't).
function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) d[i][0] = i;
  for (let j = 0; j < cols; j++) d[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost, // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // transposition
      }
    }
  }
  return d[a.length][b.length];
}

// Typo-tolerant equality check for short identifiers like artist names —
// pg_trgm already gives song names this kind of tolerance via match_songs;
// artist confirmation had none, so a single-character slip ("Coldplya")
// failed to reuse an existing "Coldplay" song entirely, silently spawning
// a duplicate. Short strings (<=4 chars) require an exact match: at that
// length a 1-edit tolerance risks conflating genuinely different short
// names, and there's no real data to confirm a safe threshold that low.
export function isCloseMatch(a: string, b: string): boolean {
  const x = normalize(a).toLowerCase();
  const y = normalize(b).toLowerCase();
  if (x === y) return true;

  const maxLen = Math.max(x.length, y.length);
  if (maxLen <= 4) return false;

  const allowedEdits = maxLen <= 8 ? 1 : 2;
  return editDistance(x, y) <= allowedEdits;
}
