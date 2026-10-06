import { NextResponse } from "next/server";
import { jsonError } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/session";
import { createTag, listTags } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const tags = await listTags(categoryId);
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      categoryId?: string;
      name?: string;
      color?: string;
    };
    if (!body.categoryId || !body.name?.trim()) {
      return NextResponse.json(
        { error: "categoryId and name are required" },
        { status: 400 },
      );
    }
    const tag = await createTag({
      categoryId: body.categoryId,
      name: body.name,
      color: body.color ?? "#5865F2",
    });
    if (!tag) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
