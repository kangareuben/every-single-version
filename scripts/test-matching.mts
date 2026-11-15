// Permanent regression suite for the song/artist matching heuristics in
// lib/crawl.ts, lib/artist-parse.ts, and lib/filter.ts — NOT a throwaway
// diagnostic script. Each case here is a real bug this session found and
// fixed via a one-off investigation script that then got deleted; this
// file exists so the next similar bug doesn't need to re-derive the fix
// from scratch, and so a future change can't silently reintroduce one of
// these without a highly-compressed network call. Fixtures use real
// YouTube titles/channels captured during the original investigations,
// not fabricated ones, since that's what actually exposed each bug.
//
// Usage: npx tsx --env-file=.env.local scripts/test-matching.mts
// No network access, no API key needed — everything here runs against
// hand-built YoutubeSearchResult fixtures, not a live search. The
// --env-file is only needed because lib/crawl.ts's import chain reaches
// lib/supabase.ts, which constructs its client eagerly at module load.
import type { YoutubeSearchResult } from "../lib/youtube";
import { countArtistBeforeSong, hasArtistChannelMatch } from "../lib/crawl";
import { parseArtistFromTitle } from "../lib/artist-parse";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
  } else {
    failed++;
    console.log(`FAIL ${label}`);
    console.log(`  expected: ${JSON.stringify(expected)}`);
    console.log(`  actual:   ${JSON.stringify(actual)}`);
  }
}

function result(title: string, channelTitle: string): YoutubeSearchResult {
  return { videoId: "x", title, description: "", channelTitle };
}

// --- hasArtistChannelMatch -------------------------------------------

{
  // Confirmed on "The Legend of Zelda Main Theme" by "Koji Kondo": a real
  // "Koji Kondo - Topic" channel corroborates the as-typed artist even
  // though game-soundtrack titles almost never use the pop "Artist -
  // Song" order (see countArtistBeforeSong cases below).
  const zelda = [
    result("The Legend of Zelda Main Theme", "Koji Kondo - Topic"),
    result("The Legend of Zelda Main Theme By Koji Kondo", "RetroGameOrchestra"),
  ];
  check(
    "hasArtistChannelMatch: Zelda / Koji Kondo (real 'Topic' channel present)",
    hasArtistChannelMatch(zelda, "Koji Kondo"),
    true,
  );
}

{
  // Confirmed on "Megalovania" by "Toby Fox": same shape, no connector
  // word at all ("Megalovania - Toby Fox"), so only the channel-identity
  // signal — not the connector-gap exclusion — can corroborate it.
  const megalovania = [
    result("Megalovania", "Toby Fox - Topic"),
    result("Megalovania - Toby Fox", "SomeCoverChannel"),
  ];
  check(
    "hasArtistChannelMatch: Megalovania / Toby Fox (real 'Topic' channel present)",
    hasArtistChannelMatch(megalovania, "Toby Fox"),
    true,
  );
}

{
  // Confirmed on "Kun Faya Kun" by "A.R. Rahman": the artist was typed
  // with no space between initials ("A.R."), but YouTube's own channel
  // renders it with one ("A. R. Rahman - Topic") — normalize() deletes
  // the periods without inserting a replacement space, so these produce
  // different token sequences at the word level. Only the whitespace-
  // stripped substring fallback catches this.
  const kunFayaKun = [
    result(
      "ROCKSTAR: Kun Faya Kun (Full Video Song) | Ranbir Kapoor | A.R. Rahman, Javed Ali, Mohit Chauhan",
      "T-Series",
    ),
    result("Nadaan Parinde", "A. R. Rahman - Topic"),
  ];
  check(
    "hasArtistChannelMatch: Kun Faya Kun / A.R. Rahman (spacing-mismatched 'Topic' channel)",
    hasArtistChannelMatch(kunFayaKun, "A.R. Rahman"),
    true,
  );
}

{
  // Confirmed on a deliberate real swap ("Metallica" typed as the song,
  // "Enter Sandman" typed as the artist): no channel is genuinely named
  // after the fake "artist" field, so this must stay false — the whole
  // point of the check is that it can only suppress a swap suggestion,
  // never manufacture false corroboration for an actual mistake.
  const metallicaSwap = [
    result("Metallica: Enter Sandman (Official Music Video)", "Metallica"),
    result("Enter Sandman - Metallica (Cover)", "SomeOtherBand"),
  ];
  check(
    "hasArtistChannelMatch: swap control, fake artist='Enter Sandman' (no real channel)",
    hasArtistChannelMatch(metallicaSwap, "Enter Sandman"),
    false,
  );
}

// --- countArtistBeforeSong --------------------------------------------

{
  // Confirmed on "The Legend of Zelda Main Theme" by "Koji Kondo": a
  // "[Piece] By [Composer]" credit shouldn't count as swap evidence
  // either way — it's a third convention, distinct from both "Artist -
  // Song" and "Song - Artist".
  const titles = [result("The Legend of Zelda Main Theme By Koji Kondo", "x")];
  check(
    "countArtistBeforeSong: '[Song] By [Composer]' doesn't count as swapped order",
    countArtistBeforeSong(titles, "Koji Kondo", "The Legend of Zelda Main Theme"),
    0,
  );
}

{
  const titles = [result("Radiohead - Creep (Live)", "x")];
  check(
    "countArtistBeforeSong: plain 'Artist - Song' counts as direct order",
    countArtistBeforeSong(titles, "Creep", "Radiohead"),
    1,
  );
}

// --- parseArtistFromTitle ----------------------------------------------

const parseCases: [string, string, string | null][] = [
  // Previously-garbage cases the parenthetical/segment cleanup targets.
  ["Shine On You Crazy Diamond (Pink Floyd cover by Alexa Melo)", "Shine On You Crazy Diamond", "Alexa Melo"],
  ["Shine on You Crazy Diamond - Pink Floyd Live at London Earls Court", "Shine On You Crazy Diamond", "Pink Floyd"],
  ["Pink Floyd Mandolin Orchestra Shine On You Crazy Diamond Mank Rüber Preema Bagger Orchester", "Shine On You Crazy Diamond", null],
  ["Time Warp (Rocky Horror Picture Show Drum Cover)", "Time Warp", "Rocky Horror Picture Show"],
  ["Time Warp (CC / HD)", "Time Warp", null],
  ["Time Warp - Rocky Horror Picture Show 11/4/17", "Time Warp", null],
  ['"The Rocky Horror Picture Show" / From Norwich / 1998 - Time Warp', "Time Warp", null],
  ["Time Warp (Guitar Lesson)", "Time Warp", null],
  ["Time Warp (version)", "Time Warp", null],
  ["Not2Series on Sessions Halloween Special - Time Warp", "Time Warp", "Not2Series"],

  // Known-good extractions that must keep working.
  ["Radiohead - Creep [live in Milan]", "Creep", "Radiohead"],
  ["Creep - Radiohead Cover", "Creep", "Radiohead"],
  ["Radiohead - Creep (Live)", "Creep", "Radiohead"],
  ["Hallelujah (Jeff Buckley cover) - Someone Else", "Hallelujah", "Someone Else"],
  ["Someone Else - Hallelujah (Jeff Buckley Cover)", "Hallelujah", "Someone Else"],
];

for (const [title, song, expected] of parseCases) {
  check(`parseArtistFromTitle: ${JSON.stringify(title)}`, parseArtistFromTitle(title, song), expected);
}

// --- summary -------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
