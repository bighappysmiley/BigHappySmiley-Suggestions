import { appBaseUrl, envVar } from "./kv";
import type { AuthConfigStatus, User } from "./types";

export function isAdminUser(user: User): boolean {
  const emails = (envVar("ADMIN_EMAILS") || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const logins = (envVar("ADMIN_GITHUB_LOGINS") || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length === 0 && logins.length === 0) {
    // Safe default until allowlists are configured: no admins.
    return false;
  }

  if (user.email && emails.includes(user.email.toLowerCase())) return true;
  if (user.githubLogin && logins.includes(user.githubLogin.toLowerCase())) {
    return true;
  }
  return false;
}

export function getAuthConfigStatus(request?: Request): AuthConfigStatus {
  return {
    githubConfigured: Boolean(
      envVar("GITHUB_CLIENT_ID") && envVar("GITHUB_CLIENT_SECRET"),
    ),
    bhsConfigured: Boolean(
      envVar("BHS_OAUTH_CLIENT_ID") &&
        envVar("BHS_OAUTH_CLIENT_SECRET") &&
        envVar("BHS_OAUTH_AUTHORIZE_URL") &&
        envVar("BHS_OAUTH_TOKEN_URL") &&
        envVar("BHS_OAUTH_USERINFO_URL"),
    ),
    emailConfigured: Boolean(
      envVar("NEON_AUTH_BASE_URL") && envVar("NEON_AUTH_COOKIE_SECRET"),
    ),
    appUrl: appBaseUrl(request),
  };
}
