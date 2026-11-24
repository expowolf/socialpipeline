// Per-platform rules. Each platform's limits live in one place so the editor
// can warn you BEFORE you post (reliability is competitors' #1 complaint).
export type MediaKind = "none" | "image" | "video";

export interface Platform {
  id: string;
  name: string;
  maxChars: number;
  needsMedia: MediaKind[] | null; // null = text-only posts allowed
  live: boolean; // true = really posts; false = simulated until API approval
}

export const PLATFORMS: Platform[] = [
  { id: "bluesky", name: "Bluesky", maxChars: 300, needsMedia: null, live: true },
  { id: "x", name: "X", maxChars: 280, needsMedia: null, live: false },
  { id: "threads", name: "Threads", maxChars: 500, needsMedia: null, live: false },
  { id: "linkedin", name: "LinkedIn", maxChars: 3000, needsMedia: null, live: false },
  { id: "facebook", name: "Facebook Page", maxChars: 63206, needsMedia: null, live: false },
  { id: "instagram", name: "Instagram", maxChars: 2200, needsMedia: ["image", "video"], live: false },
  { id: "pinterest", name: "Pinterest", maxChars: 500, needsMedia: ["image", "video"], live: false },
  { id: "tiktok", name: "TikTok", maxChars: 2200, needsMedia: ["video"], live: false },
  { id: "youtube", name: "YouTube Shorts", maxChars: 100, needsMedia: ["video"], live: false },
];

export interface Draft {
  text: string;
  mediaUrl?: string;
  mediaKind: MediaKind;
}

// Count user-visible characters (emoji = 1), not UTF-16 code units.
export function charCount(text: string): number {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...seg.segment(text)].length;
}

export function validate(p: Platform, d: Draft): string[] {
  const errors: string[] = [];
  const n = charCount(d.text);
  if (n > p.maxChars) errors.push(`${n}/${p.maxChars} characters`);
  if (!d.text.trim() && d.mediaKind === "none") errors.push("Post is empty");
  if (p.needsMedia && !p.needsMedia.includes(d.mediaKind)) {
    errors.push(`Needs ${p.needsMedia.join(" or ")}`);
  }
  if (d.mediaKind !== "none" && !d.mediaUrl) errors.push("Media URL missing");
  return errors;
}
