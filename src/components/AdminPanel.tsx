"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Category, Tag } from "@/lib/types";

const TAG_COLORS = [
  "#3BA55D",
  "#3498DB",
  "#E67E22",
  "#9B59B6",
  "#1ABC9C",
  "#E74C3C",
  "#F1C40F",
  "#2ECC71",
  "#E91E63",
  "#34495E",
];

export function AdminPanel({
  categories: initialCategories,
  tags: initialTags,
}: {
  categories: Category[];
  tags: Tag[];
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategories[0]?.id ?? "",
  );
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace(user ? "/" : "/login?redirect=/admin");
    }
  }, [loading, user, router]);

  const categoryTags = useMemo(
    () => tags.filter((tag) => tag.categoryId === selectedCategoryId),
    [tags, selectedCategoryId],
  );

  if (loading || !user?.isAdmin) {
    return <div className="page-body">Checking admin access…</div>;
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, emoji }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to create category");
      }
      const category = (await res.json()) as Category;
      setCategories((prev) => [...prev, category]);
      setSelectedCategoryId(category.id);
      setName("");
      setDescription("");
      setEmoji("📁");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function removeCategory(id: string) {
    if (!confirm("Delete this category and all of its suggestions?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete category");
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setTags((prev) => prev.filter((t) => t.categoryId !== id));
      if (selectedCategoryId === id) {
        const next = categories.find((c) => c.id !== id);
        setSelectedCategoryId(next?.id ?? "");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function createTag(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCategoryId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          name: tagName,
          color: tagColor,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to create tag");
      }
      const tag = (await res.json()) as Tag;
      setTags((prev) => [...prev, tag]);
      setTagName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function removeTag(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete tag");
      }
      setTags((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-body">
      {error && <div className="error-banner">{error}</div>}
      <div className="admin-grid">
        <section className="panel">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Categories</h2>
            <p className="field-hint" style={{ marginTop: 4 }}>
              Forum boards people can post suggestions into.
            </p>
          </div>
          <div className="admin-list">
            {categories.length === 0 ? (
              <div className="empty-state">
                <h3>No categories yet</h3>
                <p>Create the first category to start collecting suggestions.</p>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="admin-item">
                  <div>
                    <h3>
                      {category.emoji} {category.name}
                    </h3>
                    <p>{category.description || "No description"}</p>
                  </div>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      Tags
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeCategory(category.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={createCategory}
            className="composer"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="field">
              <label htmlFor="cat-name">New category name</label>
              <input
                id="cat-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
            </div>
            <div className="field">
              <label htmlFor="cat-desc">Description</label>
              <textarea
                id="cat-desc"
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What belongs in this category?"
              />
            </div>
            <div className="field">
              <label htmlFor="cat-emoji">Emoji</label>
              <input
                id="cat-emoji"
                className="input"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={8}
                style={{ maxWidth: 120 }}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Create category
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Tags</h2>
            <p className="field-hint" style={{ marginTop: 4 }}>
              Labels available when posting in a category.
            </p>
          </div>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <label className="field">
              <span>Category</span>
              <select
                className="select"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={categories.length === 0}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="admin-list">
            {!selectedCategoryId ? (
              <div className="empty-state">
                <h3>Select a category</h3>
              </div>
            ) : categoryTags.length === 0 ? (
              <div className="empty-state">
                <h3>No tags yet</h3>
                <p>Add tags so posters can label suggestions.</p>
              </div>
            ) : (
              categoryTags.map((tag) => (
                <div key={tag.id} className="admin-item">
                  <div>
                    <h3>
                      <span
                        className="tag"
                        style={{ background: tag.color, marginRight: 8 }}
                      >
                        {tag.name}
                      </span>
                    </h3>
                  </div>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeTag(tag.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={createTag}
            className="composer"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="field">
              <label htmlFor="tag-name">New tag name</label>
              <input
                id="tag-name"
                className="input"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                required
                disabled={!selectedCategoryId}
                maxLength={40}
              />
            </div>
            <div className="field">
              <label htmlFor="tag-color">Color</label>
              <select
                id="tag-color"
                className="select"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                disabled={!selectedCategoryId}
              >
                {TAG_COLORS.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
              <span
                className="tag"
                style={{ background: tagColor, alignSelf: "flex-start", marginTop: 4 }}
              >
                Preview
              </span>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || !selectedCategoryId}
              >
                Add tag
              </button>
            </div>
          </form>
        </section>
      </div>
      <p className="field-hint" style={{ marginTop: 12 }}>
        Only allowlisted admins can manage categories and tags.{" "}
        <Link href="/">Return home</Link>
      </p>
    </div>
  );
}
