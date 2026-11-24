import { platformById } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export function PlatformBadge({ id, className }: { id: string; className?: string }) {
  const p = platformById(id);
  return (
    <span
      title={p?.name ?? id}
      className={cn("grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white", className)}
      style={{ background: p?.color ?? "#666" }}
    >
      {p?.short ?? id.slice(0, 2).toUpperCase()}
    </span>
  );
}
