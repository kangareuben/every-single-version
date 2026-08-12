import { parseIso8601Duration } from "./filter";

const BASE = "https://www.googleapis.com/youtube/v3";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
};

// YouTube API returns titles/descriptions with HTML entities escaped
// (e.g. "&#39;"), since they're meant for HTML rendering contexts.
function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z0-9]+);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const code =
        entity[1] === "x" || entity[1] === "X"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
}

export async function searchVideos(
  query: string,
  maxResults = 25,
): Promise<YoutubeSearchResult[]> {
  const url = new URL(`${BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube search.list failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return (data.items ?? [])
    .filter((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .map((item: {
      id: { videoId: string };
      snippet: { title: string; description: string; channelTitle: string };
    }) => ({
      videoId: item.id.videoId,
      title: decodeHtmlEntities(item.snippet.title),
      description: decodeHtmlEntities(item.snippet.description),
      channelTitle: decodeHtmlEntities(item.snippet.channelTitle),
    }));
}

export interface YoutubeVideoDetails {
  durationSeconds: number | null;
  categoryId: string | null;
}

const VIDEOS_LIST_BATCH_SIZE = 50; // API cap on `id` params per call

export async function getVideoDetails(
  videoIds: string[],
): Promise<Map<string, YoutubeVideoDetails>> {
  const result = new Map<string, YoutubeVideoDetails>();
  if (videoIds.length === 0) return result;

  for (let i = 0; i < videoIds.length; i += VIDEOS_LIST_BATCH_SIZE) {
    const batch = videoIds.slice(i, i + VIDEOS_LIST_BATCH_SIZE);

    const url = new URL(`${BASE}/videos`);
    url.searchParams.set("part", "contentDetails,snippet");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`YouTube videos.list failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    for (const item of data.items ?? []) {
      result.set(item.id, {
        durationSeconds: parseIso8601Duration(item.contentDetails.duration),
        categoryId: item.snippet.categoryId ?? null,
      });
    }
  }
  return result;
}
