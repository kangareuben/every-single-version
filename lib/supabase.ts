import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Anon client: respects RLS, safe to use in code paths that only need
// public reads (songs/artists/song_artists/non-hidden videos).
export const supabaseAnon = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Service client: bypasses RLS, server-only. Never import this from a
// file that ships to the client bundle.
export const supabaseService = createClient(
  supabaseUrl,
  process.env.SUPABASE_SECRET_KEY!,
);
