import { NextResponse } from "next/server";
import { signOutEverywhere } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await signOutEverywhere();
  return NextResponse.json({ ok: true });
}
