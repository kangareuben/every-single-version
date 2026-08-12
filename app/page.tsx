"use client";

import { useState } from "react";
import Link from "next/link";

interface Video {
  id: string;
  video_id: string;
  title: string;
  channel_title: string;
}

interface SearchResponse {
  status: string;
  canonicalName?: string;
  message?: string;
  videos?: Video[];
  error?: string;
}

type SearchState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "results"; canonicalName: string; videos: Video[] };

// Loading a live YouTube iframe player per result doesn't scale once a
// song has dozens/hundreds of versions — each iframe pulls its own player
// bootstrap, and the browser (and YouTube itself) chokes on that many at
// once. Show a static thumbnail by default, only mount the real embed
// once someone actually clicks to play it.
function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex w-full flex-col gap-1">
      <p className="text-left text-xs text-zinc-400 dark:text-zinc-600">
        {video.title} — {video.channel_title}
      </p>
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        {playing ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- external
          // YouTube-hosted thumbnail, not a local/optimizable asset
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group relative h-full w-full"
            aria-label={`Play ${video.title}`}
          >
            <img
              src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-2xl text-white">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [songInput, setSongInput] = useState("");
  const [artistInput, setArtistInput] = useState("");
  const [state, setState] = useState<SearchState>({ phase: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!songInput.trim()) return;

    setState({ phase: "loading" });

    const params = new URLSearchParams({ song: songInput.trim() });
    if (artistInput.trim()) params.set("artist", artistInput.trim());

    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const data: SearchResponse = await res.json();

      if (!res.ok || data.status === "crawl_failed" || data.error) {
        setState({
          phase: "error",
          message: data.message ?? data.error ?? "Something went wrong.",
        });
        return;
      }

      setState({
        phase: "results",
        canonicalName: data.canonicalName ?? songInput.trim(),
        videos: data.videos ?? [],
      });
    } catch {
      setState({ phase: "error", message: "Couldn't reach the server. Try again." });
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          EverySingleVersion
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Search a song and find every version of it on YouTube: covers,
          live performances, acoustic and instrumental takes, all in one
          playlist.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            placeholder="Song name"
            value={songInput}
            onChange={(e) => setSongInput(e.target.value)}
            className="w-full rounded-full border border-black/[.08] px-5 py-3 text-black placeholder:text-zinc-400 dark:border-white/[.145] dark:text-zinc-50"
          />
          <input
            type="text"
            placeholder="Artist (optional)"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            className="w-full rounded-full border border-black/[.08] px-5 py-3 text-black placeholder:text-zinc-400 dark:border-white/[.145] dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={state.phase === "loading" || !songInput.trim()}
            className="rounded-full bg-foreground px-6 py-3 font-medium text-background disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {state.phase === "loading" && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Building your playlist, this can take a few seconds for a new
            song…
          </p>
        )}

        {state.phase === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        )}

        {state.phase === "results" && state.videos.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            No versions of &quot;{state.canonicalName}&quot; found yet.
          </p>
        )}

        {state.phase === "results" && state.videos.length > 0 && (
          <div className="flex w-full flex-col items-center gap-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {state.videos.length} version
              {state.videos.length === 1 ? "" : "s"} of &quot;
              {state.canonicalName}&quot;:
            </p>
            {state.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-500">
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
