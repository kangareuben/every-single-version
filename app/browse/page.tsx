"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SongEntry {
  id: string;
  canonicalName: string;
  artistNames: string[];
  videoCount: number;
  createdAt: string;
}

type BrowseState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "results"; songs: SongEntry[] };

const DEBOUNCE_MS = 300;

// Safety net, not a fix: repeating the exact same /api/browse URL a few
// times in one session (e.g. typing a filter, then clearing it back to
// the same empty query) has been observed — reproducibly, in both dev
// and a production build — to leave the browser's keep-alive connection
// to this server in a state where a later, unrelated fetch() on it never
// gets a response: no error, no timeout, just hangs forever. Root cause
// looks like an HTTP keep-alive handling bug in this Next.js/Turbopack
// build's server rather than anything in this component. Bounding every
// request client-side keeps the UI from hanging forever if it recurs.
const REQUEST_TIMEOUT_MS = 15000;

export default function Browse() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<BrowseState>({ phase: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const debounceTimer = setTimeout(async () => {
      setState({ phase: "loading" });
      const timeoutTimer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS);
      try {
        const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
        const res = await fetch(`/api/browse${params}`, { signal: controller.signal });
        const data = await res.json();

        if (!res.ok || data.error) {
          setState({ phase: "error", message: data.error ?? "Something went wrong." });
          return;
        }

        setState({ phase: "results", songs: data.songs ?? [] });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          if (timedOut) {
            setState({ phase: "error", message: "That took too long. Try again." });
          }
          return;
        }
        setState({ phase: "error", message: "Couldn't reach the server." });
      } finally {
        clearTimeout(timeoutTimer);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Songs on EverySingleVersion
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Every song searched so far, and how many versions we found.
        </p>

        <input
          type="text"
          placeholder="Filter by song or artist"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full border border-black/[.08] px-5 py-3 text-black placeholder:text-zinc-400 dark:border-white/[.145] dark:text-zinc-50"
        />

        {state.phase === "loading" && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</p>
        )}

        {state.phase === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        )}

        {state.phase === "results" && state.songs.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">No songs found.</p>
        )}

        {state.phase === "results" && state.songs.length > 0 && (
          <ul className="flex w-full flex-col gap-2">
            {state.songs.map((song) => {
              const params = new URLSearchParams({ song: song.canonicalName });
              if (song.artistNames[0]) params.set("artist", song.artistNames[0]);

              return (
                <li key={song.id}>
                  <Link
                    href={`/?${params.toString()}`}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-black/[.08] px-4 py-3 text-left hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium text-black dark:text-zinc-50">
                        {song.canonicalName}
                      </span>
                      {song.artistNames.length > 0 && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                          {song.artistNames.join(", ")}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                      {song.videoCount} version{song.videoCount === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-500">
          <Link href="/" className="underline">
            Search
          </Link>
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
