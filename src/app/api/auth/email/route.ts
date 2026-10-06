import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Email login is handled by Neon Auth via /login (signIn.email / signUp.email). */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Use the email form on /login. Email auth is powered by Neon Auth (NEON_AUTH_BASE_URL).",
    },
    { status: 410 },
  );
}
