"use client";
import { useRef, useState } from "react";
import { Film, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { MediaItem } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export interface UploadingItem extends Partial<MediaItem> {
  key: string;
  preview: string; // local object URL for instant preview
  kind: "image" | "video";
  name: string;
  progress: number; // 0-100
  status: "uploading" | "done" | "error";
}

// Ask the server where to put the file, then send it there with progress.
async function uploadFile(file: File, onProgress: (pct: number) => void): Promise<string> {
  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
  });
  const target = await res.json();
  if (!res.ok) throw new Error(target.error);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", target.uploadUrl);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    if (target.mode === "supabase") {
      // Same request shape supabase-js uses for signed uploads.
      const form = new FormData();
      form.append("cacheControl", "3600");
      form.append("", file);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.send(form);
    } else {
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    }
  });
  return target.publicUrl;
}

export function MediaDropzone({
  items,
  setItems,
}: {
  items: UploadingItem[];
  setItems: React.Dispatch<React.SetStateAction<UploadingItem[]>>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const patch = (key: string, p: Partial<UploadingItem>) =>
    setItems((all) => all.map((i) => (i.key === key ? { ...i, ...p } : i)));

  function addFiles(files: FileList | null) {
    for (const file of Array.from(files ?? [])) {
      const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
      if (!kind) {
        toast.error(`${file.name}: only photos and videos`);
        continue;
      }
      const key = crypto.randomUUID();
      setItems((all) => [
        ...all,
        { key, kind, name: file.name, size: file.size, type: file.type, preview: URL.createObjectURL(file), progress: 0, status: "uploading" },
      ]);
      uploadFile(file, (progress) => patch(key, { progress }))
        .then((url) => patch(key, { url, status: "done", progress: 100 }))
        .catch((e) => {
          patch(key, { status: "error" });
          toast.error(`${file.name}: ${e.message}`);
        });
    }
  }

  function remove(key: string) {
    setItems((all) => {
      const gone = all.find((i) => i.key === key);
      if (gone) URL.revokeObjectURL(gone.preview);
      return all.filter((i) => i.key !== key);
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-muted">
          <ImagePlus className="size-6 text-muted-foreground" />
        </span>
        <span className="font-medium">Drop photos or a video here</span>
        <span className="text-sm text-muted-foreground">or click to browse your computer</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((i) => (
            <div key={i.key} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {i.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.preview} alt={i.name} className="size-full object-cover" />
              ) : (
                <video src={i.preview} className="size-full object-cover" muted playsInline />
              )}
              {i.kind === "video" && (
                <span className="absolute left-1.5 top-1.5 rounded bg-black/60 p-1 text-white"><Film className="size-3" /></span>
              )}
              {i.status === "uploading" && (
                <div className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-medium text-white">
                  <span className="flex items-center gap-1.5"><Loader2 className="size-4 animate-spin" />{i.progress}%</span>
                </div>
              )}
              {i.status === "error" && (
                <div className="absolute inset-0 grid place-items-center bg-destructive/70 text-xs font-medium text-white">Failed</div>
              )}
              <button
                type="button"
                onClick={() => remove(i.key)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-80 hover:opacity-100"
                aria-label={`Remove ${i.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
