import { NextResponse } from "next/server";
import { createReply } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    suggestionId?: string;
    body?: string;
    authorName?: string;
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
    authorName: body.authorName ?? "Anonymous",
  });
  if (!reply) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }
  return NextResponse.json(reply, { status: 201 });
}
