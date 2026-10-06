"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, config, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const redirect = params.get("redirect") || "/";
  const queryError = params.get("error");

  const errorMessage = useMemo(() => {
    if (error) return error;
    if (!queryError) return null;
    const map: Record<string, string> = {
      github_not_configured:
        "GitHub login is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
      bhs_not_configured:
        "BigHappySmiley login is not configured. Set BHS_OAUTH_* environment variables.",
      missing_code: "OAuth callback was missing an authorization code.",
      invalid_state: "OAuth state was invalid or expired. Try again.",
      missing_token: "Magic link token was missing.",
      invalid_or_expired_link: "That magic link is invalid or expired.",
    };
    return map[queryError] || queryError;
  }, [error, queryError]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirect.startsWith("/") ? redirect : "/");
    }
  }, [loading, user, redirect, router]);

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Failed to send magic link");
      setStatus(data.message || "Check your email for a sign-in link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setSending(false);
    }
  }

  const githubHref = `/api/auth/github?redirect=${encodeURIComponent(redirect)}`;
  const bhsHref = `/api/auth/bhs?redirect=${encodeURIComponent(redirect)}`;

  return (
    <div className="login-page">
      <div className="panel login-card">
        <h1>Sign in</h1>
        <p className="login-lead">
          Browse freely. Sign in to post suggestions and replies. Category
          management is limited to admins.
        </p>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}
        {status && <div className="success-banner">{status}</div>}

        <div className="login-actions">
          {config?.githubConfigured ? (
            <a className="btn btn-secondary login-btn" href={githubHref}>
              Continue with GitHub
            </a>
          ) : (
            <button type="button" className="btn btn-secondary login-btn" disabled>
              Continue with GitHub (configure env)
            </button>
          )}

          {config?.bhsConfigured ? (
            <a className="btn btn-secondary login-btn" href={bhsHref}>
              Continue with BigHappySmiley
            </a>
          ) : (
            <button type="button" className="btn btn-secondary login-btn" disabled>
              Continue with BigHappySmiley (configure env)
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary login-btn"
            disabled
            title="Not available yet"
          >
            BigHappySmiley Community — coming soon
          </button>
        </div>

        <div className="login-divider">
          <span>or email magic link</span>
        </div>

        <form onSubmit={onEmailSubmit} className="login-email">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={!config?.emailConfigured || sending}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={!config?.emailConfigured || sending}
          >
            {sending
              ? "Sending…"
              : config?.emailConfigured
                ? "Email me a sign-in link"
                : "Email login (configure env)"}
          </button>
        </form>

        <p className="field-hint" style={{ marginTop: 14 }}>
          <Link href="/">← Back to categories</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-body">Loading sign-in…</div>}>
      <LoginForm />
    </Suspense>
  );
}
