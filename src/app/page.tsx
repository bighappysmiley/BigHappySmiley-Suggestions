import Link from "next/link";
import { getPublicUser } from "@/lib/auth/session";
import { listCategories, listSuggestions } from "@/lib/store";

export default async function HomePage() {
  const [categories, user] = await Promise.all([
    listCategories(),
    getPublicUser(),
  ]);
  const counts = await Promise.all(
    categories.map(async (category) => {
      const suggestions = await listSuggestions(category.id);
      return {
        id: category.id,
        threads: suggestions.length,
        pinned: suggestions.filter((s) => s.pinned).length,
      };
    }),
  );
  const countMap = new Map(counts.map((c) => [c.id, c]));

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Categories</h1>
          <p>
            Browse forum categories and open a board to read or post suggestions.
          </p>
        </div>
        {user?.isAdmin ? (
          <Link href="/admin" className="btn btn-secondary">
            Manage categories
          </Link>
        ) : !user ? (
          <Link href="/login" className="btn btn-secondary">
            Sign in
          </Link>
        ) : null}
      </header>
      <div className="page-body">
        {categories.length === 0 ? (
          <div className="panel empty-state">
            <h3>No categories yet</h3>
            <p>
              {user?.isAdmin
                ? "Create the first category to open the board."
                : "An admin needs to create a category before people can post."}
            </p>
            <div style={{ marginTop: 12 }}>
              {user?.isAdmin ? (
                <Link href="/admin" className="btn btn-primary">
                  Go to admin
                </Link>
              ) : (
                <Link href="/login" className="btn btn-primary">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="category-grid">
            {categories.map((category) => {
              const stats = countMap.get(category.id);
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="category-row"
                >
                  <div className="category-icon">{category.emoji}</div>
                  <div className="category-meta">
                    <h2>{category.name}</h2>
                    <p>{category.description || "No description"}</p>
                  </div>
                  <div className="category-stats">
                    <div>
                      {stats?.threads ?? 0}{" "}
                      {(stats?.threads ?? 0) === 1 ? "thread" : "threads"}
                    </div>
                    <div>{stats?.pinned ?? 0} pinned</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
