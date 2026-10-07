import { appBaseUrl, envVar, getAuthKv, randomToken } from "./kv";

export type OAuthState = {
  provider: "github" | "bhs";
  redirectTo: string;
  codeVerifier?: string;
  createdAt: string;
};

function stateKey(state: string) {
  return `auth:oauth_state:${state}`;
}

export async function createOAuthState(
  data: Omit<OAuthState, "createdAt">,
): Promise<string> {
  const kv = await getAuthKv();
  const state = randomToken(24);
  const payload: OAuthState = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  await kv.put(stateKey(state), JSON.stringify(payload), {
    expirationTtl: 60 * 15,
  });
  return state;
}

export async function consumeOAuthState(
  state: string,
): Promise<OAuthState | null> {
  const kv = await getAuthKv();
  const raw = await kv.get(stateKey(state));
  if (!raw) return null;
  await kv.delete(stateKey(state));
  return JSON.parse(raw) as OAuthState;
}

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function githubAuthorizeUrl(state: string, request: Request): string {
  const clientId = envVar("GITHUB_CLIENT_ID");
  if (!clientId) throw new Error("GITHUB_CLIENT_ID is not configured");
  const redirectUri = `${appBaseUrl(request)}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeGithubCode(
  code: string,
  request: Request,
): Promise<{
  accessToken: string;
}> {
  const clientId = envVar("GITHUB_CLIENT_ID");
  const clientSecret = envVar("GITHUB_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth is not configured");
  }
  const redirectUri = `${appBaseUrl(request)}/api/auth/github/callback`;
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to exchange GitHub authorization code");
  }
  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || "GitHub token exchange failed");
  }
  return { accessToken: data.access_token };
}

export async function fetchGithubProfile(accessToken: string): Promise<{
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}> {
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "BigHappySmiley-Suggestions",
    },
  });
  if (!userRes.ok) throw new Error("Failed to load GitHub profile");
  const user = (await userRes.json()) as {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };

  let email = user.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "BigHappySmiley-Suggestions",
      },
    });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      email =
        emails.find((e) => e.primary && e.verified)?.email ||
        emails.find((e) => e.verified)?.email ||
        emails[0]?.email ||
        null;
    }
  }

  return {
    id: String(user.id),
    login: user.login,
    name: user.name,
    email,
    avatar_url: user.avatar_url,
  };
}

export async function createPkcePair(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const verifier = randomToken(48);
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const challenge = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { verifier, challenge };
}

export function bhsAuthorizeUrl(
  state: string,
  codeChallenge: string,
  request: Request,
): string {
  const clientId = envVar("BHS_OAUTH_CLIENT_ID");
  const authorizeUrl = envVar("BHS_OAUTH_AUTHORIZE_URL");
  if (!clientId || !authorizeUrl) {
    throw new Error("BigHappySmiley OAuth is not configured");
  }
  const redirectUri = `${appBaseUrl(request)}/api/auth/bhs/callback`;
  const scope = envVar("BHS_OAUTH_SCOPE") || "openid profile email";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${authorizeUrl}?${params}`;
}

export async function exchangeBhsCode(
  code: string,
  codeVerifier: string,
  request: Request,
): Promise<{ accessToken: string }> {
  const clientId = envVar("BHS_OAUTH_CLIENT_ID");
  const clientSecret = envVar("BHS_OAUTH_CLIENT_SECRET");
  const tokenUrl = envVar("BHS_OAUTH_TOKEN_URL");
  if (!clientId || !clientSecret || !tokenUrl) {
    throw new Error("BigHappySmiley OAuth is not configured");
  }
  const redirectUri = `${appBaseUrl(request)}/api/auth/bhs/callback`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: codeVerifier,
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BigHappySmiley token exchange failed: ${text}`);
  }
  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(
      data.error_description || data.error || "BigHappySmiley token exchange failed",
    );
  }
  return { accessToken: data.access_token };
}

export async function fetchBhsProfile(accessToken: string): Promise<{
  id: string;
  email: string | null;
  name: string;
  image: string | null;
}> {
  const userinfoUrl = envVar("BHS_OAUTH_USERINFO_URL");
  if (!userinfoUrl) throw new Error("BHS_OAUTH_USERINFO_URL is not configured");
  const res = await fetch(userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load BigHappySmiley profile");
  const profile = (await res.json()) as Record<string, unknown>;
  const idValue =
    (profile.sub as string | undefined) ||
    (profile.id as string | undefined) ||
    (profile.user_id as string | undefined);
  if (!idValue) throw new Error("BigHappySmiley userinfo missing subject id");
  const email =
    (profile.email as string | undefined) ||
    (profile.preferred_username as string | undefined) ||
    null;
  const name =
    (profile.name as string | undefined) ||
    (profile.preferred_username as string | undefined) ||
    email ||
    "BigHappySmiley user";
  const image =
    (profile.picture as string | undefined) ||
    (profile.avatar_url as string | undefined) ||
    null;
  return { id: String(idValue), email, name, image };
}
