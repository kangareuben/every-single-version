# EverySingleVersion

Search a song and get every cover, live version, acoustic take, and remix of it on YouTube in one list — not just the official upload.

Live at [every-single-version.vercel.app](https://every-single-version.vercel.app/).

## How it works

- User searches `song` (+ optional `artist`) via `/api/search` ([app/api/search/route.ts](app/api/search/route.ts)).
- First search for a song triggers a crawl ([lib/crawl.ts](lib/crawl.ts)): several YouTube Data API queries (base query + `cover`/`live`/`acoustic`/`instrumental` variants), results run through a filter ([lib/filter.ts](lib/filter.ts)) that rejects lyric videos, reaction/tutorial junk, wrong-duration clips, and titles where the song/artist match is coincidental rather than a real mention, then passing results are cached in Supabase.
- Later searches for the same song serve the cached list straight from the DB; if the cache is older than 24h it's served immediately and re-crawled in the background.
- Selected results mount a real YouTube `iframe` embed on click rather than every result loading its own player up front ([app/page.tsx](app/page.tsx)).
- Users can flag a bad result via `/api/flag` ([app/api/flag/route.ts](app/api/flag/route.ts)).

## Stack

Next.js 16 (App Router) + React 19, Tailwind CSS v4, Supabase (Postgres + RPC fuzzy song matching, schema in [supabase/](supabase/)), YouTube Data API v3.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Requires a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
YOUTUBE_API_KEY=
IP_HASH_SALT=
```

Supabase project needs the schema in [supabase/schema.sql](supabase/schema.sql) (plus [supabase/fuzzy_match.sql](supabase/fuzzy_match.sql) and [supabase/grants.sql](supabase/grants.sql)) applied.

## Deploy

Pushes to `main` auto-deploy to Vercel (project already linked via `.vercel/`).
