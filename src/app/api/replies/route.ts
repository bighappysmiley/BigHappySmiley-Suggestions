import { NextResponse } from "next/server";
import { jsonError } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/session";
import { createReply } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      suggestionId?: string;
      body?: string;
    };
    if (!body.suggestionId || !body.body?.trim()) {
      return NextResponse.json(
        { error: "suggestionId and body are required" },
        { status: 400 },
      );
    }
    const reply = await createReply({
      suggestionId: body.suggestionId,
      body: body.body,
      authorId: user.id,
      authorName: user.name,
    });
    if (!reply) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
