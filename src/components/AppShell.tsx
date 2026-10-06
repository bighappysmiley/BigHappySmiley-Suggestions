"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";

export function AppShell({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      <div
        className={`sidebar-backdrop${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-title">Suggestions</div>
          <div className="sidebar-brand-sub">Internal forum</div>
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
          <Link
            href="/admin"
            className={`sidebar-link${pathname.startsWith("/admin") ? " active" : ""}`}
          >
            <span className="sidebar-link-emoji">⚙</span>
            <span className="sidebar-link-text">Manage categories</span>
          </Link>
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
  );
}
