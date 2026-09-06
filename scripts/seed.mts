// Manually-triggered seeding script — NOT scheduled/automated by design
// (see conversation: an unattended daily cron would compete with the
// developer's own testing for the same 100-call/day YouTube quota, and
// the crawl/filter pipeline is still actively having edge cases found
// and fixed, which benefits from a human looking at each result).
//
// Usage: npx tsx --env-file=.env.local scripts/seed.mts [count]
// Walks SEED_SONGS in order, skipping any song already well-populated
// in the DB (zero quota cost), and calls the real search API for up to
// `count` (default 3) not-yet-seeded songs. Safe to re-run daily by
// hand — already-done entries are skipped for free, so each run just
// advances the frontier by a few more.
import { SEED_SONGS } from "./seed-song-list";
import { supabaseService } from "../lib/supabase";
import { wordsOf, isCloseMatch } from "../lib/normalize";

const API_BASE = process.env.SEED_API_BASE ?? "https://every-single-version.vercel.app";
const count = Number(process.argv[2] ?? 3);

function isRepeatedPhraseOf(longer: string[], shorter: string[]): boolean {
  if (shorter.length === 0) return false;
  if (longer.length <= shorter.length) return false;
  if (longer.length % shorter.length !== 0) return false;
  const repeats = longer.length / shorter.length;
  for (let i = 0; i < repeats; i++) {
    for (let j = 0; j < shorter.length; j++) {
      if (longer[i * shorter.length + j] !== shorter[j]) return false;
    }
  }
  return true;
}

// Approximates the search route's own candidate-selection logic (name
// match + confirmed artist + non-empty) directly against the DB, so
// checking "is this already done" costs zero YouTube quota.
async function alreadySeeded(song: string, artist: string): Promise<boolean> {
  const songWords = wordsOf(song);
  const { data: candidates } = await supabaseService
    .from("songs")
    .select("id, canonical_name")
    .ilike("canonical_name", `%${song.split(" ")[0]}%`);

  for (const c of candidates ?? []) {
    const candidateWords = wordsOf(c.canonical_name);
    const nameOk =
      candidateWords.length === songWords.length ||
      isRepeatedPhraseOf(candidateWords, songWords) ||
      isRepeatedPhraseOf(songWords, candidateWords);
    if (!nameOk) continue;

    const { data: links } = await supabaseService
      .from("song_artists")
      .select("artists(name)")
      .eq("song_id", c.id);
    const artistNames = (links ?? [])
      .map((l) => (l.artists as unknown as { name: string } | null)?.name)
      .filter((n): n is string => Boolean(n));
    if (!artistNames.some((n) => isCloseMatch(n, artist))) continue;

    const { count: videoCount } = await supabaseService
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("song_id", c.id)
      .eq("hidden", false);
    if (videoCount && videoCount > 0) return true;
  }
  return false;
}

let attempted = 0;
let skippedAlreadyDone = 0;

for (const { year, song, artist } of SEED_SONGS) {
  if (attempted >= count) break;

  if (await alreadySeeded(song, artist)) {
    skippedAlreadyDone++;
    continue;
  }

  attempted++;
  const url = `${API_BASE}/api/search?song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}`;
  console.log(`[${year}] "${song}" by "${artist}" ...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(
      `  -> status=${data.status} videos=${data.videos?.length ?? "n/a"}${data.message ? ` (${data.message})` : ""}`,
    );
  } catch (err) {
    console.log(`  -> request failed: ${(err as Error).message}`);
  }
}

console.log(
  `\nDone. ${attempted} new song(s) attempted, ${skippedAlreadyDone} already-seeded song(s) skipped for free.`,
);
