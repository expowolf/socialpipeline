"use client";
import { useCallback, useEffect, useState } from "react";
import { PLATFORMS, charCount, validate, type Draft, type MediaKind } from "@/lib/platforms";
import type { Post } from "@/lib/store";
import { Calendar } from "./components/Calendar";

const box: React.CSSProperties = { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 };

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
function localInputValue(d: Date) {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default function Home() {
  const [text, setText] = useState("");
  const [mediaKind, setMediaKind] = useState<MediaKind>("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selected, setSelected] = useState<string[]>(["bluesky"]);
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState(localInputValue(new Date(Date.now() + 60 * 60_000)));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const draft: Draft = { text, mediaKind, mediaUrl: mediaUrl || undefined };

  const load = useCallback(() => fetch("/api/posts").then((r) => r.json()).then(setPosts), []);

  // While the page is open, check for due posts every 30s. On Vercel, an
  // external cron does this so posts go out even with the page closed.
  useEffect(() => {
    load();
    const tick = () => fetch("/api/cron").then((r) => r.ok && r.json()).then((r) => r?.published && load()).catch(() => {});
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const blocked = selected.some((id) => validate(PLATFORMS.find((p) => p.id === id)!, draft).length);

  async function submit() {
    setBusy(true);
    setMessage(null);
    const scheduledAt = when === "later" ? new Date(scheduleAt).toISOString() : null;
    const r = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, platforms: selected, scheduledAt }),
    });
    const post = await r.json();
    if (!r.ok) setMessage({ ok: false, text: post.error });
    else if (post.status === "scheduled")
      setMessage({ ok: true, text: `Scheduled for ${new Date(post.scheduledAt).toLocaleString()}` });
    else {
      const bad = post.results.filter((x: any) => !x.ok);
      setMessage({
        ok: !bad.length,
        text: bad.length ? `Failed: ${bad.map((x: any) => `${x.platform} (${x.error})`).join(", ")}` : `Posted (${post.status})`,
      });
    }
    if (r.ok) setText("");
    setBusy(false);
    load();
  }

  async function cancel(id: string) {
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>SocialPipeline</h1>
      <p style={{ marginTop: 0, color: "#555" }}>Write once, post everywhere. Prototype.</p>

      <section style={box}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you want to post?"
          rows={6}
          style={{ width: "100%", boxSizing: "border-box", fontSize: 16, padding: 8 }}
        />
        <div style={{ color: "#555", fontSize: 14 }}>{charCount(text)} characters</div>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={mediaKind} onChange={(e) => setMediaKind(e.target.value as MediaKind)}>
            <option value="none">No media</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          {mediaKind !== "none" && (
            <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Public URL of the image/video" style={{ flex: 1, minWidth: 200 }} />
          )}
        </div>
      </section>

      <section style={box}>
        <h3 style={{ marginTop: 0 }}>Platforms</h3>
        {PLATFORMS.map((p) => {
          const errs = validate(p, draft);
          return (
            <label key={p.id} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
              <span style={{ width: 120 }}>{p.name}</span>
              <span style={{ fontSize: 12, color: "#777", width: 70 }}>{p.live ? "live" : "simulated"}</span>
              <span style={{ fontSize: 13, color: errs.length ? "#b00020" : "#1b7f3b" }}>
                {errs.length ? errs.join(" · ") : `OK (${charCount(text)}/${p.maxChars})`}
              </span>
            </label>
          );
        })}

        <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label><input type="radio" checked={when === "now"} onChange={() => setWhen("now")} /> Post now</label>
          <label><input type="radio" checked={when === "later"} onChange={() => setWhen("later")} /> Schedule</label>
          {when === "later" && (
            <input type="datetime-local" value={scheduleAt} min={localInputValue(new Date())}
              onChange={(e) => setScheduleAt(e.target.value)} />
          )}
        </div>

        <button onClick={submit} disabled={busy || blocked || !selected.length}
          style={{ marginTop: 12, padding: "10px 20px", fontSize: 16, cursor: "pointer" }}>
          {busy ? "Working..." : when === "now"
            ? `Post to ${selected.length} platform${selected.length === 1 ? "" : "s"}`
            : "Schedule post"}
        </button>
        {blocked && <div style={{ color: "#b00020", fontSize: 13, marginTop: 6 }}>Fix the errors on checked platforms first.</div>}
        {message && <div style={{ marginTop: 8, color: message.ok ? "#1b7f3b" : "#b00020" }}>{message.text}</div>}
      </section>

      <section style={box}>
        <h3 style={{ marginTop: 0 }}>Calendar</h3>
        <Calendar posts={posts} onCancel={cancel} />
      </section>
    </main>
  );
}
