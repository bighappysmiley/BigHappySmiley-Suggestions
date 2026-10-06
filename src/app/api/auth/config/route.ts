import { NextResponse } from "next/server";
import { getAuthConfigStatus } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return NextResponse.json(getAuthConfigStatus(request));
}
