// Per-platform rules, in one place, so the composer can warn BEFORE posting.
export type MediaKind = "image" | "video";

export interface MediaItem {
  url: string; // public URL (Supabase) or /api/uploads/local/... (dev)
  kind: MediaKind;
  name: string;
  size: number; // bytes
  type: string; // MIME type
}

export interface Draft {
  caption: string;
  captions?: Record<string, string>; // optional per-platform override
  media: MediaItem[];
}

export interface Platform {
  id: string;
  name: string;
  short: string; // 2-letter badge
  color: string; // badge background
  maxChars: number;
  mediaRequired: boolean;
  maxImages: number; // 0 = no photos
  maxVideos: number; // 0 = no videos
  live: boolean; // true = really posts; false = simulated until API approval
}

export const PLATFORMS: Platform[] = [
  { id: "instagram", name: "Instagram", short: "IG", color: "#E1306C", maxChars: 2200, mediaRequired: true, maxImages: 10, maxVideos: 1, live: false },
  { id: "tiktok", name: "TikTok", short: "TT", color: "#111111", maxChars: 2200, mediaRequired: true, maxImages: 0, maxVideos: 1, live: false },
  { id: "youtube", name: "YouTube Shorts", short: "YT", color: "#FF0000", maxChars: 100, mediaRequired: true, maxImages: 0, maxVideos: 1, live: false },
  { id: "x", name: "X", short: "X", color: "#000000", maxChars: 280, mediaRequired: false, maxImages: 4, maxVideos: 1, live: false },
  { id: "threads", name: "Threads", short: "TH", color: "#333333", maxChars: 500, mediaRequired: false, maxImages: 10, maxVideos: 1, live: false },
  { id: "facebook", name: "Facebook Page", short: "FB", color: "#1877F2", maxChars: 63206, mediaRequired: false, maxImages: 10, maxVideos: 1, live: false },
  { id: "linkedin", name: "LinkedIn", short: "IN", color: "#0A66C2", maxChars: 3000, mediaRequired: false, maxImages: 9, maxVideos: 1, live: false },
  { id: "pinterest", name: "Pinterest", short: "PI", color: "#E60023", maxChars: 500, mediaRequired: true, maxImages: 1, maxVideos: 1, live: false },
  { id: "bluesky", name: "Bluesky", short: "BS", color: "#1185FE", maxChars: 300, mediaRequired: false, maxImages: 4, maxVideos: 0, live: true },
];

export const platformById = (id: string) => PLATFORMS.find((p) => p.id === id);

// Count user-visible characters (an emoji = 1), not UTF-16 code units.
export function charCount(text: string): number {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...seg.segment(text)].length;
}

export const captionFor = (d: Draft, platformId: string) => d.captions?.[platformId] ?? d.caption;

export function validate(p: Platform, d: Draft): string[] {
  const errors: string[] = [];
  const caption = captionFor(d, p.id);
  const n = charCount(caption);
  const images = d.media.filter((m) => m.kind === "image").length;
  const videos = d.media.filter((m) => m.kind === "video").length;

  if (n > p.maxChars) errors.push(`${n}/${p.maxChars} characters`);
  if (!caption.trim() && !d.media.length) errors.push("Empty post");
  if (p.mediaRequired && !d.media.length) errors.push(p.maxImages ? "Needs a photo or video" : "Needs a video");
  if (images && videos) errors.push("Can't mix photos and videos");
  else if (images > p.maxImages) errors.push(p.maxImages ? `Max ${p.maxImages} photo${p.maxImages > 1 ? "s" : ""}` : "Videos only");
  else if (videos > p.maxVideos) errors.push(p.maxVideos ? `Max ${p.maxVideos} video` : "No video support yet");
  return errors;
}
