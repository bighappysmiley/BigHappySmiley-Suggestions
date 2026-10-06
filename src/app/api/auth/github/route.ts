import { NextResponse } from "next/server";
import { getAuthConfigStatus } from "@/lib/auth/admin";
import {
  createOAuthState,
  githubAuthorizeUrl,
  safeRedirectPath,
} from "@/lib/auth/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const status = getAuthConfigStatus(request);
  if (!status.githubConfigured) {
    return NextResponse.redirect(
      new URL("/login?error=github_not_configured", request.url),
    );
  }
  const url = new URL(request.url);
  const redirectTo = safeRedirectPath(url.searchParams.get("redirect"));
  const state = await createOAuthState({
    provider: "github",
    redirectTo,
  });
  return NextResponse.redirect(githubAuthorizeUrl(state, request));
}
