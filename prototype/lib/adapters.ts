// One adapter per platform, all with the same shape. Later you can swap a
// simulated adapter for a unified API (Upload-Post/Late) or a direct API
// without touching the rest of the app.
import { AtpAgent, RichText } from "@atproto/api";
import type { Draft } from "./platforms";

export interface PublishResult {
  platform: string;
  ok: boolean;
  url?: string;
  error?: string;
  simulated?: boolean;
}

type Adapter = (d: Draft) => Promise<Omit<PublishResult, "platform">>;

const bluesky: Adapter = async (d) => {
  const identifier = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !password) {
    return { ok: false, error: "Set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD in .env.local" };
  }
  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.login({ identifier, password });

  const rt = new RichText({ text: d.text });
  await rt.detectFacets(agent); // makes links and @mentions clickable

  let embed: any;
  if (d.mediaKind === "image" && d.mediaUrl) {
    const img = await fetch(d.mediaUrl);
    if (!img.ok) return { ok: false, error: `Could not download image (${img.status})` };
    const bytes = new Uint8Array(await img.arrayBuffer());
    const encoding = img.headers.get("content-type") ?? "image/jpeg";
    const { data } = await agent.uploadBlob(bytes, { encoding });
    embed = { $type: "app.bsky.embed.images", images: [{ image: data.blob, alt: "" }] };
  } else if (d.mediaKind === "video") {
    return { ok: false, error: "Video posting to Bluesky not built yet" };
  }

  const res = await agent.post({ text: rt.text, facets: rt.facets, embed, createdAt: new Date().toISOString() });
  const rkey = res.uri.split("/").pop();
  return { ok: true, url: `https://bsky.app/profile/${agent.session?.handle}/post/${rkey}` };
};

// Placeholder for platforms waiting on API approval / a unified API key.
const simulated: Adapter = async () => {
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, simulated: true };
};

const ADAPTERS: Record<string, Adapter> = { bluesky };

export async function publish(platform: string, d: Draft): Promise<PublishResult> {
  const adapter = ADAPTERS[platform] ?? simulated;
  try {
    return { platform, ...(await adapter(d)) };
  } catch (e: any) {
    return { platform, ok: false, error: e?.message ?? String(e) };
  }
}
