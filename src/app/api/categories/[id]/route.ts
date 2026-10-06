import { NextResponse } from "next/server";
import {
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    emoji?: string;
  };
  const category = await updateCategory(id, body);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const ok = await deleteCategory(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
