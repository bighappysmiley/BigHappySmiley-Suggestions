import { NextResponse } from "next/server";
import { createSuggestion, listSuggestions } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
  }
  const suggestions = await listSuggestions(categoryId);
  return NextResponse.json(suggestions);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    categoryId?: string;
    title?: string;
    body?: string;
    authorName?: string;
    tagIds?: string[];
  };
  if (!body.categoryId || !body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "categoryId, title, and body are required" },
      { status: 400 },
    );
  }
  const suggestion = await createSuggestion({
    categoryId: body.categoryId,
    title: body.title,
    body: body.body,
    authorName: body.authorName ?? "Anonymous",
    tagIds: body.tagIds ?? [],
  });
  if (!suggestion) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  return NextResponse.json(suggestion, { status: 201 });
}
