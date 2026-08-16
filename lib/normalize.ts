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
