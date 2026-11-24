// One adapter per platform, all with the same shape, so a simulated adapter can
// later be swapped for a unified API (Upload-Post/Late) or a direct API.
import { AtpAgent, RichText } from "@atproto/api";
import { loadMedia } from "./media";
import type { MediaItem } from "./platforms";

export interface PublishResult {
  platform: string;
  ok: boolean;
  url?: string;
  error?: string;
  simulated?: boolean;
}

export interface Outgoing {
  caption: string; // already resolved for this platform
  media: MediaItem[];
}

type Adapter = (o: Outgoing) => Promise<Omit<PublishResult, "platform">>;

const bluesky: Adapter = async ({ caption, media }) => {
  const identifier = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !password) return { ok: false, error: "Set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD" };

  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.login({ identifier, password });
  const rt = new RichText({ text: caption });
  await rt.detectFacets(agent); // clickable links and @mentions

  let embed: any;
  const images = media.filter((m) => m.kind === "image");
  if (images.length) {
    const tooBig = images.find((m) => m.size > 1_000_000);
    if (tooBig) return { ok: false, error: `${tooBig.name} is over Bluesky's 1 MB image limit` };
    const uploaded = await Promise.all(
      images.map(async (m) => (await agent.uploadBlob(await loadMedia(m.url), { encoding: m.type })).data.blob)
    );
    embed = { $type: "app.bsky.embed.images", images: uploaded.map((image) => ({ image, alt: "" })) };
  }

  const res = await agent.post({ text: rt.text, facets: rt.facets, embed, createdAt: new Date().toISOString() });
  return { ok: true, url: `https://bsky.app/profile/${agent.session?.handle}/post/${res.uri.split("/").pop()}` };
};

// Placeholder for platforms waiting on API approval / a unified API key.
const simulated: Adapter = async () => {
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, simulated: true };
};

const ADAPTERS: Record<string, Adapter> = { bluesky };

export async function publish(platform: string, o: Outgoing): Promise<PublishResult> {
  try {
    return { platform, ...(await (ADAPTERS[platform] ?? simulated)(o)) };
  } catch (e: any) {
    return { platform, ok: false, error: e?.message ?? String(e) };
  }
}
