// One-word texting/song-title shorthand mapped to its full word — e.g.
// "good 4 u" and "good 4 you" are the same song, but without this the
// literal-minded matcher treats "u" and "you" as unrelated, so whichever
// spelling got searched first "won" and the other kept resolving back to
// it (confirmed on "good 4 u" by Olivia Rodrigo: the "good 4 you" typo
// found almost nothing — real titles say "u" — but still cached as the
// song, permanently blocking the correct spelling).
//
// Deliberately single-word-for-single-word only: something that expands
// to multiple words (e.g. "gonna" -> "going to") would change word count
// between spellings, which the match_songs word-count guard (see
// app/api/search/route.ts) relies on staying stable between a title and
// its variants.
//
// "2" and "4" map to "to" and "for" rather than being excluded like other
// bare digits: both double as literal track/volume/sequel numbers
// constantly ("Now That's What I Call Music 4", "Kill Bill Vol 2"), but
// "to" and "for" are both in STOPWORDS below, so folding the digits into
// them doesn't introduce a new risky token — it plugs into a signal
// already treated as weak/content-free. Confirmed safe against real
// counter-examples, not just this catalog: Spice Girls' "2 Become 1"
// uses "2" as the literal word "two", and "4 Non Blondes" uses "4" as
// literal "four" — but since no other real song or artist is titled "To
// Become 1"/"Too Become One" or "For Non Blondes" to collide with,
// canonicalizing them alongside "to"/"for" causes no false merge, just
// reunifies spelling variants of the one real title (confirmed on
// "Nothing Compares 2 U" by Sinéad O'Connor: the "Nothing Compares To
// You" spelling matched only 5/50 real results — missing the official
// video entirely — until "2" was recognized as equivalent; the same
// stylization appears throughout Prince's catalog, e.g. "I Would Die 4
// U"). "too" joins the "to"/"2" bucket for the same reason.
const SHORTHAND: Record<string, string> = {
  u: "you",
  ur: "your",
  n: "and",
  "2": "to",
  too: "to",
  "4": "for",
  b4: "before",
  gr8: "great",
  l8: "late",
  w8: "wait",
  m8: "mate",
  thru: "through",
  luv: "love",
  cuz: "because",
  coz: "because",
};

const SHORTHAND_PATTERN = new RegExp(
  `\\b(${Object.keys(SHORTHAND).join("|")})\\b`,
  "gi",
);

export function normalize(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "Beyoncé" -> "Beyonce"
    .replace(/\((official|lyric|lyrics|audio|music)[^)]*\)/gi, "")
    .replace(/\[(official|lyric|lyrics|audio|music)[^\]]*\]/gi, "")
    .replace(/\bfeat\.?\b/gi, "")
    .replace(/\bft\.?\b/gi, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(SHORTHAND_PATTERN, (match) => SHORTHAND[match.toLowerCase()])
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
  "for",
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
