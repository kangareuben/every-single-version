import { supabaseService } from "./supabase";

// Server-only: links an artist name to a song, creating the artist row
// if needed. Used both when the search endpoint confirms an artist via
// channel-title fallback, and when the crawl job parses an artist name
// out of a video title.
export async function linkArtistToSong(songId: string, artistName: string) {
  const trimmed = artistName.trim();
  if (!trimmed) return;

  const { data: existing, error: lookupError } = await supabaseService
    .from("artists")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();
  if (lookupError) console.error("linkArtistToSong lookup:", lookupError);

  let artistId = existing?.id as string | undefined;

  if (!artistId) {
    const { data: inserted, error: insertError } = await supabaseService
      .from("artists")
      .insert({ name: trimmed })
      .select("id")
      .single();
    if (insertError) console.error("linkArtistToSong insert:", insertError);
    artistId = inserted?.id;
  }

  if (!artistId) return;

  const { error: upsertError } = await supabaseService
    .from("song_artists")
    .upsert(
      { song_id: songId, artist_id: artistId },
      { onConflict: "song_id,artist_id" },
    );
  if (upsertError) console.error("linkArtistToSong upsert:", upsertError);
}
