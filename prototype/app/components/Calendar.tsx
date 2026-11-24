"use client";
import { useState } from "react";
import type { Post } from "@/lib/store";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_ICON: Record<string, string> = {
  scheduled: "🕒", publishing: "⏳", published: "✅", partial: "⚠️", failed: "❌", cancelled: "🚫",
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const postDate = (p: Post) => new Date(p.scheduledAt ?? p.createdAt);

export function Calendar({ posts, onCancel }: { posts: Post[]; onCancel: (id: string) => void }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState<string>(dayKey(today));

  // Group posts by local calendar day.
  const byDay = new Map<string, Post[]>();
  for (const p of posts) {
    const k = dayKey(postDate(p));
    byDay.set(k, [...(byDay.get(k) ?? []), p]);
  }

  // 6 rows x 7 days, starting on the Sunday on/before the 1st.
  const start = new Date(month);
  start.setDate(1 - month.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const pickedPosts = (byDay.get(picked) ?? []).sort((a, b) => +postDate(a) - +postDate(b));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <button onClick={() => shift(-1)}>‹</button>
        <strong style={{ flex: 1, textAlign: "center" }}>
          {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </strong>
        <button onClick={() => shift(1)}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ fontSize: 12, color: "#777", textAlign: "center" }}>{d}</div>
        ))}
        {cells.map((d) => {
          const k = dayKey(d);
          const list = byDay.get(k) ?? [];
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = k === dayKey(today);
          return (
            <button
              key={k}
              onClick={() => setPicked(k)}
              style={{
                minHeight: 56, padding: 4, textAlign: "left", verticalAlign: "top",
                border: k === picked ? "2px solid #111" : "1px solid #eee",
                background: isToday ? "#f0f4ff" : "#fff",
                color: inMonth ? "#111" : "#bbb", cursor: "pointer", borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400 }}>{d.getDate()}</div>
              <div style={{ fontSize: 11 }}>
                {list.slice(0, 3).map((p) => <span key={p.id}>{STATUS_ICON[p.status]}</span>)}
                {list.length > 3 && ` +${list.length - 3}`}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        {!pickedPosts.length && <div style={{ color: "#777", fontSize: 14 }}>No posts this day.</div>}
        {pickedPosts.map((p) => (
          <div key={p.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0", fontSize: 14 }}>
            <div style={{ color: "#555" }}>
              {STATUS_ICON[p.status]} {postDate(p).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              {" · "}{p.status}{" · "}{p.platforms.join(", ")}
              {p.status === "scheduled" && (
                <button onClick={() => onCancel(p.id)} style={{ marginLeft: 8, fontSize: 12 }}>Cancel</button>
              )}
            </div>
            <div>{p.draft.text.slice(0, 160) || "(media only)"}</div>
            {p.results.filter((r) => !r.ok || r.url).map((r) => (
              <div key={r.platform} style={{ fontSize: 12, color: r.ok ? "#1b7f3b" : "#b00020" }}>
                {r.platform}: {r.url ? <a href={r.url} target="_blank">view post</a> : r.error}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
