export function normalize(raw: string): string {
  return raw
    .replace(/\((official|lyric|lyrics|audio|music)[^)]*\)/gi, "")
    .replace(/\[(official|lyric|lyrics|audio|music)[^\]]*\]/gi, "")
    .replace(/\bfeat\.?\b/gi, "")
    .replace(/\bft\.?\b/gi, "")
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
