import { supabaseService } from "@/lib/supabase";
import { hashIp, getClientIp } from "@/lib/ip-hash";

const FLAG_HIDE_THRESHOLD = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;
const RATE_LIMIT_MAX_FLAGS = 10;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const videoId = body?.videoId;

  if (!videoId || typeof videoId !== "string") {
    return Response.json({ error: "videoId is required" }, { status: 400 });
  }

  const ipHash = hashIp(getClientIp(request));

  // Rate limit: cap flags per IP hash within a window, across all videos,
  // to prevent spam-hiding.
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { count: recentCount, error: rateError } = await supabaseService
    .from("flags")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (rateError) {
    return Response.json({ error: rateError.message }, { status: 500 });
  }
  if ((recentCount ?? 0) >= RATE_LIMIT_MAX_FLAGS) {
    return Response.json(
      { error: "Too many flags from this connection recently. Try again later." },
      { status: 429 },
    );
  }

  // Dedup: don't let one visitor inflate a single video's flag count by
  // flagging it repeatedly. No DB-level unique constraint on
  // (video_id, ip_hash) yet — this check-then-insert has a small race
  // window under near-simultaneous requests, acceptable for a flagging
  // feature's stakes.
  const { data: existing } = await supabaseService
    .from("flags")
    .select("id")
    .eq("video_id", videoId)
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (existing) {
    return Response.json({ status: "already_flagged" });
  }

  const { error: insertError } = await supabaseService
    .from("flags")
    .insert({ video_id: videoId, ip_hash: ipHash });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const { data: video, error: fetchError } = await supabaseService
    .from("videos")
    .select("flag_count")
    .eq("id", videoId)
    .single();

  if (fetchError || !video) {
    return Response.json(
      { error: fetchError?.message ?? "video not found" },
      { status: 404 },
    );
  }

  const newFlagCount = video.flag_count + 1;
  const shouldHide = newFlagCount >= FLAG_HIDE_THRESHOLD;

  const { error: updateError } = await supabaseService
    .from("videos")
    .update({ flag_count: newFlagCount, hidden: shouldHide })
    .eq("id", videoId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({
    status: "flagged",
    flagCount: newFlagCount,
    hidden: shouldHide,
  });
}
