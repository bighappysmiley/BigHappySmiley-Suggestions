import { NextResponse } from "next/server";
import { jsonError } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/session";
import { deleteTag } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ok = await deleteTag(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
