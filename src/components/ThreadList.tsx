"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import type { SortMode, Suggestion, Tag } from "@/lib/types";
import { Avatar } from "./Avatar";
import { TagBadge } from "./TagBadge";

export function ThreadList({
  categoryId,
  suggestions,
  tags,
}: {
  categoryId: string;
  suggestions: Suggestion[];
  tags: Tag[];
}) {
  const [sort, setSort] = useState<SortMode>("recent");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const tagMap = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag])),
    [tags],
  );

  const filtered = useMemo(() => {
    let list = [...suggestions];
    if (activeTags.length > 0) {
      list = list.filter((s) => activeTags.every((tid) => s.tagIds.includes(tid)));
    }
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "replies") return b.replyCount - a.replyCount;
      if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [suggestions, activeTags, sort]);

  function toggleTag(tagId: string) {
    setActiveTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  return (
    <>
      <div className="toolbar">
        <label>
          <span className="field-hint" style={{ marginRight: 6 }}>
            Sort
          </span>
          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option value="recent">Recent activity</option>
            <option value="created">Creation date</option>
            <option value="replies">Most replies</option>
          </select>
        </label>
        <div className="toolbar-spacer" />
        <Link href={`/categories/${categoryId}/new`} className="btn btn-primary">
          New suggestion
        </Link>
      </div>

      {tags.length > 0 && (
        <div className="tag-filters" aria-label="Filter by tags">
          {tags.map((tag) => {
            const active = activeTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={`tag-chip${active ? " active" : ""}`}
                style={active ? { background: tag.color } : undefined}
                onClick={() => toggleTag(tag.id)}
              >
                {!active && (
                  <span className="dot" style={{ background: tag.color }} />
                )}
                {tag.name}
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setActiveTags([])}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="panel">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No suggestions match</h3>
            <p>Try clearing filters or create a new suggestion in this category.</p>
          </div>
        ) : (
          <div className="thread-list">
            {filtered.map((suggestion) => (
              <Link
                key={suggestion.id}
                href={`/suggestions/${suggestion.id}`}
                className={`thread-row${suggestion.pinned ? " pinned" : ""}`}
              >
                <Avatar name={suggestion.authorName} />
                <div className="thread-main">
                  <div className="thread-title-row">
                    {suggestion.pinned && (
                      <span className="pin-badge">Pinned</span>
                    )}
                    <span className="thread-title">{suggestion.title}</span>
                  </div>
                  {suggestion.tagIds.length > 0 && (
                    <div className="thread-tags">
                      {suggestion.tagIds.map((tagId) => {
                        const tag = tagMap.get(tagId);
                        return tag ? <TagBadge key={tagId} tag={tag} /> : null;
                      })}
                    </div>
                  )}
                  <div className="thread-sub">
                    {suggestion.authorName} · started{" "}
                    {formatRelativeTime(suggestion.createdAt)}
                  </div>
                </div>
                <div className="thread-aside">
                  <strong>
                    {suggestion.replyCount}{" "}
                    {suggestion.replyCount === 1 ? "reply" : "replies"}
                  </strong>
                  <span>{formatRelativeTime(suggestion.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
