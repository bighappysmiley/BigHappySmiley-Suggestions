import { NextResponse } from "next/server";
import { neonAuth, neonAuthConfigured } from "@/lib/auth/neon-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notConfigured() {
  return NextResponse.json(
    { error: "Email authentication is temporarily unavailable." },
    { status: 503 },
  );
}

const handlers = neonAuthConfigured && neonAuth ? neonAuth.handler() : null;

export const GET = handlers?.GET ?? (async () => notConfigured());
export const POST = handlers?.POST ?? (async () => notConfigured());
export const PUT = handlers?.PUT ?? (async () => notConfigured());
export const PATCH = handlers?.PATCH ?? (async () => notConfigured());
export const DELETE = handlers?.DELETE ?? (async () => notConfigured());
