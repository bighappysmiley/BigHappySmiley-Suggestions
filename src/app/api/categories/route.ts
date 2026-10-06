import { NextResponse } from "next/server";
import { createCategory, listCategories } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    emoji?: string;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const category = await createCategory({
    name: body.name,
    description: body.description ?? "",
    emoji: body.emoji ?? "📁",
  });
  return NextResponse.json(category, { status: 201 });
}
