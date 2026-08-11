import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          EverySingleVersion
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Search a song and find every version of it on YouTube: covers,
          live performances, acoustic and instrumental takes, all in one
          playlist.
        </p>
        <form className="flex w-full flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Song name"
            disabled
            className="w-full rounded-full border border-black/[.08] px-5 py-3 text-black placeholder:text-zinc-400 dark:border-white/[.145] dark:text-zinc-50"
          />
          <input
            type="text"
            placeholder="Artist"
            disabled
            className="w-full rounded-full border border-black/[.08] px-5 py-3 text-black placeholder:text-zinc-400 dark:border-white/[.145] dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled
            className="rounded-full bg-foreground px-6 py-3 font-medium text-background opacity-50"
          >
            Search
          </button>
        </form>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Search is not live yet. Come back soon.
        </p>

        <div className="flex w-full flex-col items-center gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Example results:
          </p>
          {["r2dUHg4-TRc", "GIMVm8a9to8", "Ny2uEaNt7L8"].map((videoId, i) => (
            <div key={videoId} className="flex w-full flex-col gap-1">
              <p className="text-left text-xs text-zinc-400 dark:text-zinc-600">
                Version {i + 1}
              </p>
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`Example YouTube video result ${i + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>

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
