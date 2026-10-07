"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Tag } from "@/lib/types";

export function NewSuggestionForm({
  categoryId,
  tags,
}: {
  categoryId: string;
  tags: Tag[];
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleTag(tagId: string) {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/categories/${categoryId}/new`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title,
          body,
          tagIds,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to create suggestion");
      }
      const suggestion = (await res.json()) as { id: string };
      router.push(`/suggestions/${suggestion.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (!loading && !user) {
    return (
      <div className="panel form-card">
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Sign in required</h2>
        <p className="field-hint">
          You can browse suggestions freely. Sign in to create a new thread.
        </p>
        <div className="form-actions">
          <Link
            href={`/login?redirect=/categories/${categoryId}/new`}
            className="btn btn-primary"
          >
            Sign in to post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="panel form-card" onSubmit={onSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you suggesting?"
          required
          maxLength={160}
        />
      </div>
      <div className="field">
        <label htmlFor="body">Details</label>
        <textarea
          id="body"
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe the idea, why it matters, and any constraints."
          required
        />
      </div>
      {user && (
        <p className="field-hint">Posting as {user.name}</p>
      )}
      {tags.length > 0 && (
        <div className="field">
          <label>Tags</label>
          <div className="tag-picker">
            {tags.map((tag) => {
              const selected = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-option${selected ? " selected" : ""}`}
                  style={selected ? { background: tag.color } : undefined}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push(`/categories/${categoryId}`)}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Posting…" : "Post suggestion"}
        </button>
      </div>
    </form>
  );
}
