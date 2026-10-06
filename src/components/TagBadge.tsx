import type { Tag } from "@/lib/types";

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span className="tag" style={{ background: tag.color }}>
      {tag.name}
    </span>
  );
}
