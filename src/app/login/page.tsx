"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { neonAuthClient } from "@/lib/auth/neon-client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, config, loading, refresh } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (!config?.emailConfigured) {
      setError(
        "Neon Auth is not configured. Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET.",
      );
      return;
    }
    setSending(true);
    setError(null);
    setStatus(null);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await neonAuthClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "User",
        });
        if (signUpError) {
          throw new Error(signUpError.message || "Failed to create account");
        }
        setStatus("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error: signInError } = await neonAuthClient.signIn.email({
          email,
          password,
        });
        if (signInError) {
          throw new Error(signInError.message || "Failed to sign in");
        }
        await refresh();
        router.replace(redirect.startsWith("/") ? redirect : "/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email auth failed");
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
          <span>or email via Neon Auth</span>
        </div>

        <form onSubmit={onEmailSubmit} className="login-email">
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={!config?.emailConfigured || sending}
              />
            </div>
          )}
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
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              disabled={!config?.emailConfigured || sending}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={!config?.emailConfigured || sending}
          >
            {sending
              ? "Working…"
              : !config?.emailConfigured
                ? "Email login (configure Neon Auth)"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in with email"}
          </button>
          <button
            type="button"
            className="btn btn-ghost login-btn"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
              setStatus(null);
            }}
            disabled={sending}
          >
            {mode === "signin"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </form>

        <p className="field-hint" style={{ marginTop: 14 }}>
          Email auth is powered by Neon Auth (verification emails via Neon).{" "}
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
