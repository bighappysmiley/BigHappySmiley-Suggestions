"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatRelativeTime } from "@/lib/format";
import type { Category, Reply, Suggestion, Tag } from "@/lib/types";
import { Avatar } from "./Avatar";
import { TagBadge } from "./TagBadge";

export function ThreadView({
  category,
  suggestion: initialSuggestion,
  replies: initialReplies,
  tags,
}: {
  category: Category;
  suggestion: Suggestion;
  replies: Reply[];
  tags: Tag[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState(initialSuggestion);
  const [replies, setReplies] = useState(initialReplies);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pinning, setPinning] = useState(false);

  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));

  async function togglePin() {
    if (!user?.isAdmin) return;
    setPinning(true);
    setError(null);
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "togglePin" }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to update pin");
      }
      const updated = (await res.json()) as Suggestion;
      setSuggestion(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pin update failed");
    } finally {
      setPinning(false);
    }
  }

  async function onReply(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/suggestions/${suggestion.id}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          body,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to post reply");
      }
      const reply = (await res.json()) as Reply;
      setReplies((prev) => [...prev, reply]);
      setSuggestion((prev) => ({
        ...prev,
        replyCount: prev.replyCount + 1,
        updatedAt: reply.createdAt,
      }));
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p style={{ marginBottom: 4 }}>
            <Link href={`/categories/${category.id}`} className="btn btn-ghost btn-sm">
              ← {category.emoji} {category.name}
            </Link>
          </p>
          <h1>{suggestion.title}</h1>
          <p>
            {suggestion.pinned ? "Pinned · " : ""}
            {suggestion.replyCount}{" "}
            {suggestion.replyCount === 1 ? "reply" : "replies"} · last activity{" "}
            {formatRelativeTime(suggestion.updatedAt)}
          </p>
        </div>
        {user?.isAdmin && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={togglePin}
            disabled={pinning}
          >
            {suggestion.pinned ? "Unpin" : "Pin"}
          </button>
        )}
      </header>

      <div className="page-body">
        {error && <div className="error-banner">{error}</div>}
        <div className="thread-view">
          <article className="panel post-card op">
            <div className="post-header">
              <Avatar name={suggestion.authorName} />
              <div>
                <div className="post-author">{suggestion.authorName}</div>
                <div className="post-time">
                  {formatRelativeTime(suggestion.createdAt)}
                </div>
              </div>
            </div>
            {suggestion.tagIds.length > 0 && (
              <div className="thread-tags" style={{ marginBottom: 10 }}>
                {suggestion.tagIds.map((tagId) => {
                  const tag = tagMap.get(tagId);
                  return tag ? <TagBadge key={tagId} tag={tag} /> : null;
                })}
              </div>
            )}
            <div className="post-body">{suggestion.body}</div>
          </article>

          <div className="panel">
            <div className="reply-list">
              {replies.length === 0 ? (
                <div className="empty-state">
                  <h3>No replies yet</h3>
                  <p>
                    {user
                      ? "Start the discussion."
                      : "Sign in to reply to this suggestion."}
                  </p>
                </div>
              ) : (
                replies.map((reply) => (
                  <article key={reply.id} className="post-card">
                    <div className="post-header">
                      <Avatar name={reply.authorName} size={32} />
                      <div>
                        <div className="post-author">{reply.authorName}</div>
                        <div className="post-time">
                          {formatRelativeTime(reply.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="post-body">{reply.body}</div>
                  </article>
                ))
              )}
            </div>
            {user ? (
              <form className="composer" onSubmit={onReply}>
                <div className="field">
                  <label htmlFor="reply-body">Reply as {user.name}</label>
                  <textarea
                    id="reply-body"
                    className="textarea"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Add a reply…"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Posting…" : "Post reply"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="composer">
                <p className="field-hint">Sign in to join this thread.</p>
                <Link
                  href={`/login?redirect=/suggestions/${suggestion.id}`}
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-start" }}
                >
                  Sign in to reply
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
