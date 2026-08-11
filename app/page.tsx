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
