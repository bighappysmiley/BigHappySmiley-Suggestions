import { NextResponse } from "next/server";
import { consumeMagicLinkToken } from "@/lib/auth/email";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { upsertEmailUser } from "@/lib/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  const email = await consumeMagicLinkToken(token);
  if (!email) {
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired_link", request.url));
  }

  const user = await upsertEmailUser(email);
  const session = await createSession(user.id);
  await setSessionCookie(session.token);
  return NextResponse.redirect(new URL("/", request.url));
}
