"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Category } from "@/lib/types";

export function AppShell({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isLogin = pathname.startsWith("/login");

  return (
    <>
      <div
        className={`sidebar-backdrop${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <div className="app-shell">
        <aside className={`sidebar${open ? " open" : ""}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-title">Suggestions</div>
            <div className="sidebar-brand-sub">BigHappySmiley forum</div>
          </div>
          <div className="sidebar-section-label">Categories</div>
          <nav className="sidebar-nav" aria-label="Categories">
            <Link
              href="/"
              className={`sidebar-link${pathname === "/" ? " active" : ""}`}
            >
              <span className="sidebar-link-emoji">⌂</span>
              <span className="sidebar-link-text">All categories</span>
            </Link>
            {categories.map((category) => {
              const href = `/categories/${category.id}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={category.id}
                  href={href}
                  className={`sidebar-link${active ? " active" : ""}`}
                >
                  <span className="sidebar-link-emoji">{category.emoji}</span>
                  <span className="sidebar-link-text">{category.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-footer">
            {user?.isAdmin && (
              <Link
                href="/admin"
                className={`sidebar-link${pathname.startsWith("/admin") ? " active" : ""}`}
              >
                <span className="sidebar-link-emoji">⚙</span>
                <span className="sidebar-link-text">Manage categories</span>
              </Link>
            )}
            {!loading && user ? (
              <div className="sidebar-user">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-meta">
                  {user.isAdmin ? "Admin" : "Member"}
                  {user.email ? ` · ${user.email}` : ""}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void logout()}
                  style={{ marginTop: 6, color: "var(--text-on-dark-muted)" }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(pathname)}`}
                className={`sidebar-link${isLogin ? " active" : ""}`}
              >
                <span className="sidebar-link-emoji">⇢</span>
                <span className="sidebar-link-text">Sign in</span>
              </Link>
            )}
          </div>
        </aside>
        <div className="main">
          <div className="mobile-topbar">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              Menu
            </button>
            <strong>Suggestions</strong>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
