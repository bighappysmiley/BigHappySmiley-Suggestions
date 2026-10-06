import { NextResponse } from "next/server";
import { getSuggestion, listReplies, listTags, togglePin } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const suggestion = await getSuggestion(id);
  if (!suggestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [replies, tags] = await Promise.all([
    listReplies(id),
    listTags(suggestion.categoryId),
  ]);
  return NextResponse.json({ suggestion, replies, tags });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as { action?: string };
  if (body.action === "togglePin") {
    const suggestion = await togglePin(id);
    if (!suggestion) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(suggestion);
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
