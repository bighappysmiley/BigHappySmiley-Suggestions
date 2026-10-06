import { NextResponse } from "next/server";
import {
  consumeOAuthState,
  exchangeBhsCode,
  fetchBhsProfile,
  safeRedirectPath,
} from "@/lib/auth/oauth";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { upsertOAuthUser } from "@/lib/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthError)}`, request.url),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const saved = await consumeOAuthState(state);
  if (!saved || saved.provider !== "bhs" || !saved.codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  try {
    const { accessToken } = await exchangeBhsCode(
      code,
      saved.codeVerifier,
      request,
    );
    const profile = await fetchBhsProfile(accessToken);
    const user = await upsertOAuthUser({
      provider: "bhs",
      providerAccountId: profile.id,
      email: profile.email,
      name: profile.name,
      image: profile.image,
    });
    const session = await createSession(user.id);
    await setSessionCookie(session.token);
    return NextResponse.redirect(
      new URL(safeRedirectPath(saved.redirectTo), request.url),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "bhs_failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
