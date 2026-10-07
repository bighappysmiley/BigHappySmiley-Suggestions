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
        "GitHub sign-in is temporarily unavailable. Please use email instead.",
      bhs_not_configured:
        "BigHappySmiley sign-in is temporarily unavailable. Please use email instead.",
      missing_code: "Sign-in did not complete. Please try again.",
      invalid_state: "Your sign-in session expired. Please try again.",
    };
    return map[queryError] || "Something went wrong while signing in. Please try again.";
  }, [error, queryError]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirect.startsWith("/") ? redirect : "/");
    }
  }, [loading, user, redirect, router]);

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (!config?.emailConfigured) {
      setError("Email sign-in is temporarily unavailable. Please try again later.");
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
          name: name.trim() || email.split("@")[0] || "Member",
        });
        if (signUpError) {
          throw new Error(signUpError.message || "Could not create your account");
        }
        setStatus("Account created. Sign in with your email and password.");
        setMode("signin");
      } else {
        const { error: signInError } = await neonAuthClient.signIn.email({
          email,
          password,
        });
        if (signInError) {
          throw new Error(signInError.message || "Could not sign in");
        }
        await refresh();
        router.replace(redirect.startsWith("/") ? redirect : "/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete email sign-in");
    } finally {
      setSending(false);
    }
  }

  const githubHref = `/api/auth/github?redirect=${encodeURIComponent(redirect)}`;
  const bhsHref = `/api/auth/bhs?redirect=${encodeURIComponent(redirect)}`;
  const showOAuth = Boolean(config?.githubConfigured || config?.bhsConfigured);

  return (
    <div className="login-page">
      <div className="panel login-card">
        <h1>Sign in</h1>
        <p className="login-lead">
          Browse suggestions freely. Sign in to post ideas and join the discussion.
        </p>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}
        {status && <div className="success-banner">{status}</div>}

        {showOAuth && (
          <div className="login-actions">
            {config?.githubConfigured && (
              <a className="btn btn-secondary login-btn" href={githubHref}>
                Continue with GitHub
              </a>
            )}
            {config?.bhsConfigured && (
              <a className="btn btn-secondary login-btn" href={bhsHref}>
                Continue with BigHappySmiley
              </a>
            )}
          </div>
        )}

        {showOAuth && (
          <div className="login-divider">
            <span>or continue with email</span>
          </div>
        )}

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
                autoComplete="name"
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
              placeholder="you@example.com"
              required
              autoComplete="email"
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
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              disabled={!config?.emailConfigured || sending}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={!config?.emailConfigured || sending}
          >
            {sending
              ? "Please wait…"
              : !config?.emailConfigured
                ? "Email sign-in unavailable"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
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
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </form>

        <p className="field-hint" style={{ marginTop: 14 }}>
          <Link href="/">Back to suggestions</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-body">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
