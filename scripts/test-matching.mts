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
import { countArtistBeforeSong, hasArtistChannelMatch, hasStrongMatch } from "../lib/crawl";
import { parseArtistFromTitle } from "../lib/artist-parse";
import { filterResult } from "../lib/filter";
import { classifyVersion, interleaveByClassification } from "../lib/version-classify";

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

// --- hasStrongMatch: channel-title fallback ----------------------------

{
  // Confirmed on "Down by the Riverside" by "Fisk Jubilee Singers":
  // every real "The Fisk Jubilee Singers - Topic" upload has a bare
  // title, so without a channel fallback this gate aborted the crawl
  // before it ever reached filterResult's own channel-title handling.
  const riverside = [
    result("Down By The Riverside", "The Fisk Jubilee Singers - Topic"),
    result("Vestal and Jubilee Choir Down By The Riverside", "Cody Sisler"),
  ];
  check(
    "hasStrongMatch: channel-title fallback accepts a bare-title official upload",
    hasStrongMatch(riverside, "Down by the Riverside", "Fisk Jubilee Singers"),
    true,
  );
}

{
  // Confirmed on "Run" by "Run DMC" (not a real song): the channel
  // fallback above initially regressed this control — the real "Run
  // D.M.C. - Topic" channel's unrelated upload "Hit It Run" satisfied
  // both the song match (title contains "run") and the new channel
  // match (channel contains "Run DMC"), with zero actual connection.
  // Needs the same structural containment guard as the title path, just
  // checking the song name against the artist's own name instead of
  // against a title.
  const runDmc = [
    result("Hit It Run", "Run D.M.C. - Topic"),
    result("It's Tricky", "Run-D.M.C."),
  ];
  check(
    "hasStrongMatch: channel-title fallback still rejects a containment artifact",
    hasStrongMatch(runDmc, "Run", "Run DMC"),
    false,
  );
}

// --- filterResult: channel-title fallback ------------------------------

{
  // The original case this fallback was built for — a YouTube auto-
  // generated "Topic" channel upload with a bare title (artist only in
  // channel_title). Confirmed on "The Saint Beyond the River" by
  // "Fellowship": without this fallback the official original-audio
  // upload was dropped entirely.
  check(
    "filterResult: Topic-channel fallback accepts a bare-title official upload",
    filterResult("The Saint Beyond the River", "Fellowship", {
      title: "The Saint Beyond the River",
      description: "",
      durationSeconds: 300,
      categoryId: "10",
      channelTitle: "Fellowship - Topic",
    }).pass,
    true,
  );

  check(
    "filterResult: Topic-channel fallback still rejects an unrelated channel",
    filterResult("The Saint Beyond the River", "Fellowship", {
      title: "The Saint Beyond the River",
      description: "",
      durationSeconds: 300,
      categoryId: "10",
      channelTitle: "Some Unrelated Channel",
    }).pass,
    false,
  );

  // Same initials-spacing mismatch as the hasArtistChannelMatch case
  // above, but here it's the crawl/filter pipeline itself (not just
  // swap-detection) wrongly dropping a real official upload — confirmed
  // on "Nadaan Parinde" by "A.R. Rahman".
  check(
    "filterResult: Topic-channel fallback tolerates initials-spacing mismatch",
    filterResult("Nadaan Parinde", "A.R. Rahman", {
      title: "Nadaan Parinde",
      description: "",
      durationSeconds: 240,
      categoryId: "10",
      channelTitle: "A. R. Rahman - Topic",
    }).pass,
    true,
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

// --- classifyVersion -----------------------------------------------------

check(
  "classifyVersion: searched artist performing their own song is 'original'",
  classifyVersion({ title: "Jimi Hendrix - Hey Joe", channelTitle: "x" }, "Hey Joe", "Jimi Hendrix"),
  "original",
);

check(
  "classifyVersion: a different named performer is 'cover'",
  classifyVersion({ title: "Otis Taylor - Hey Joe", channelTitle: "x" }, "Hey Joe", "Jimi Hendrix"),
  "cover",
);

{
  // isCloseMatch alone (edit-distance) rejects this pair outright — needs
  // the word-set containment fallback so the artist's own full billing
  // isn't mistaken for a different, unrelated act.
  const classification = classifyVersion(
    { title: "The Jimi Hendrix Experience - Hey Joe", channelTitle: "x" },
    "Hey Joe",
    "Jimi Hendrix",
  );
  check(
    "classifyVersion: fuller billing of the same artist is still 'original'",
    classification,
    "original",
  );
}

check(
  "classifyVersion: a bare-title 'Topic' channel upload is 'original'",
  classifyVersion(
    { title: "Hey Joe", channelTitle: "Jimi Hendrix - Topic" },
    "Hey Joe",
    "Jimi Hendrix",
  ),
  "original",
);

check(
  "classifyVersion: unparseable title + cover-signal keyword falls back to 'cover'",
  classifyVersion(
    { title: "Hey Joe (Acoustic Cover)", channelTitle: "RandomChannel123" },
    "Hey Joe",
    "Jimi Hendrix",
  ),
  "cover",
);

check(
  "classifyVersion: no parseable artist, no channel match, no cover keyword is 'unknown'",
  classifyVersion({ title: "Hey Joe", channelTitle: "SomeRandomChannel" }, "Hey Joe", "Jimi Hendrix"),
  "unknown",
);

// --- interleaveByClassification -------------------------------------------

{
  const items = [
    { label: "o1", classification: "original" as const },
    { label: "o2", classification: "original" as const },
    { label: "o3", classification: "original" as const },
    { label: "c1", classification: "cover" as const },
  ];
  check(
    "interleaveByClassification: a lone cover surfaces first, not buried after the originals",
    interleaveByClassification(items).map((i) => i.label),
    ["c1", "o1", "o2", "o3"],
  );
}

check(
  "interleaveByClassification: empty input stays empty",
  interleaveByClassification([]),
  [],
);

// --- summary -------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
