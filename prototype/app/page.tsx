"use client";
import { useEffect, useState } from "react";
import { PLATFORMS, charCount, validate, type Draft, type MediaKind } from "@/lib/platforms";
import type { PublishResult } from "@/lib/adapters";
import type { HistoryEntry } from "@/lib/store";

const box: React.CSSProperties = { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 };

export default function Home() {
  const [text, setText] = useState("");
  const [mediaKind, setMediaKind] = useState<MediaKind>("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selected, setSelected] = useState<string[]>(["bluesky"]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PublishResult[] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const draft: Draft = { text, mediaKind, mediaUrl: mediaUrl || undefined };
  const loadHistory = () => fetch("/api/history").then((r) => r.json()).then(setHistory);
  useEffect(() => { loadHistory(); }, []);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const blocked = selected.some((id) => validate(PLATFORMS.find((p) => p.id === id)!, draft).length);

  async function post() {
    setBusy(true);
    setResults(null);
    const r = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, platforms: selected }),
    }).then((r) => r.json());
    setResults(r.results ?? [{ platform: "-", ok: false, error: r.error }]);
    setBusy(false);
    loadHistory();
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
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Public URL of the image/video"
              style={{ flex: 1, minWidth: 200 }}
            />
          )}
        </div>
      </section>

      <section style={box}>
        <h3 style={{ marginTop: 0 }}>Platforms</h3>
        {PLATFORMS.map((p) => {
          const errs = validate(p, draft);
          const on = selected.includes(p.id);
          return (
            <label key={p.id} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #eee" }}>
              <input type="checkbox" checked={on} onChange={() => toggle(p.id)} />
              <span style={{ width: 130 }}>{p.name}</span>
              <span style={{ fontSize: 12, color: "#777", width: 80 }}>{p.live ? "live" : "simulated"}</span>
              <span style={{ fontSize: 13, color: errs.length ? "#b00020" : "#1b7f3b" }}>
                {errs.length ? errs.join(" · ") : `OK (${charCount(text)}/${p.maxChars})`}
              </span>
            </label>
          );
        })}
        <button
          onClick={post}
          disabled={busy || blocked || !selected.length}
          style={{ marginTop: 12, padding: "10px 20px", fontSize: 16, cursor: "pointer" }}
        >
          {busy ? "Posting..." : `Post to ${selected.length} platform${selected.length === 1 ? "" : "s"}`}
        </button>
        {blocked && <div style={{ color: "#b00020", fontSize: 13, marginTop: 6 }}>Fix the errors on checked platforms first.</div>}
      </section>

      {results && (
        <section style={box}>
          <h3 style={{ marginTop: 0 }}>Results</h3>
          {results.map((r) => (
            <div key={r.platform}>
              {r.ok ? "✅" : "❌"} {r.platform}
              {r.simulated && " (simulated)"}
              {r.url && <> — <a href={r.url} target="_blank">view post</a></>}
              {r.error && <span style={{ color: "#b00020" }}> — {r.error}</span>}
            </div>
          ))}
        </section>
      )}

      <section style={box}>
        <h3 style={{ marginTop: 0 }}>History</h3>
        {!history.length && <div style={{ color: "#777" }}>Nothing posted yet.</div>}
        {history.map((h) => (
          <div key={h.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0", fontSize: 14 }}>
            <div style={{ color: "#777" }}>{new Date(h.at).toLocaleString()}</div>
            <div>{h.draft.text.slice(0, 120) || "(media only)"}</div>
            <div>{h.results.map((r) => `${r.ok ? "✅" : "❌"} ${r.platform}`).join("  ")}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
