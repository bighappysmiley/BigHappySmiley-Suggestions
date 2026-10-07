import { NextResponse } from "next/server";
import { getAuthConfigStatus } from "@/lib/auth/admin";
import {
  bhsAuthorizeUrl,
  createOAuthState,
  createPkcePair,
  safeRedirectPath,
} from "@/lib/auth/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const status = getAuthConfigStatus(request);
  if (!status.bhsConfigured) {
    return NextResponse.redirect(
      new URL("/login?error=bhs_not_configured", request.url),
    );
  }
  const url = new URL(request.url);
  const redirectTo = safeRedirectPath(url.searchParams.get("redirect"));
  const pkce = await createPkcePair();
  const state = await createOAuthState({
    provider: "bhs",
    redirectTo,
    codeVerifier: pkce.verifier,
  });
  return NextResponse.redirect(bhsAuthorizeUrl(state, pkce.challenge, request));
}
