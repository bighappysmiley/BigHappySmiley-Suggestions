import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Email login is handled by Neon Auth on /login. */
export async function POST() {
  return NextResponse.json(
    { error: "Use the email form on the sign-in page." },
    { status: 410 },
  );
}
