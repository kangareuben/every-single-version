export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-16 text-black dark:text-zinc-50">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-zinc-500">Last updated: August 2026</p>

      <p>
        EverySingleVersion does not require an account and does not collect
        personal information to use the search feature.
      </p>

      <h2 className="text-xl font-medium mt-4">What we store</h2>
      <p>
        We cache metadata about YouTube videos (video ID, title, channel
        name) associated with searched songs, so repeat searches do not
        require re-querying YouTube. We do not store or rehost any video or
        audio content.
      </p>

      <h2 className="text-xl font-medium mt-4">Flagging feature</h2>
      <p>
        If you flag a video as an incorrect result, we store a one-way hash
        of your IP address, not the raw address, to rate-limit abuse of the
        flagging feature. This hash is not linked to any other data and is
        not used to identify you.
      </p>

      <h2 className="text-xl font-medium mt-4">Third parties</h2>
      <p>
        Video playback is embedded directly from YouTube. Your interaction
        with embedded players is subject to Google&apos;s own privacy
        policy.
      </p>

      <h2 className="text-xl font-medium mt-4">Contact</h2>
      <p>Questions: everysingleversion@gmail.com</p>
    </main>
  );
}
