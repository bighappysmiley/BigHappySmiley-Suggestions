import { NextResponse } from "next/server";
import { jsonError } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/session";
import { createCategory, listCategories } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
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
  } catch (error) {
    return jsonError(error);
  }
}
