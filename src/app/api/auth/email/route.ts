import { NextResponse } from "next/server";
import { getAuthConfigStatus } from "@/lib/auth/admin";
import { createMagicLinkToken, sendMagicLinkEmail } from "@/lib/auth/email";
import { jsonError } from "@/lib/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const status = getAuthConfigStatus(request);
    if (!status.emailConfigured) {
      return NextResponse.json(
        {
          error:
            "Email login is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const token = await createMagicLinkToken(email);
    await sendMagicLinkEmail({ email, token, request });
    return NextResponse.json({
      ok: true,
      message: "Check your email for a sign-in link.",
    });
  } catch (error) {
    return jsonError(error);
  }
}
