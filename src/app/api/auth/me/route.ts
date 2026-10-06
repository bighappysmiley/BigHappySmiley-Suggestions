import { NextResponse } from "next/server";
import { getAuthConfigStatus } from "@/lib/auth/admin";
import { getPublicUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getPublicUser();
  return NextResponse.json({
    user,
    config: getAuthConfigStatus(request),
  });
}
