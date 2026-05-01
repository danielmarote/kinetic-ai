import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ botId: string; docId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId, docId } = await params;

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const doc = await db.botDocument.findFirst({
    where: { id: docId, botId, bot: { userId: user.id } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.botDocument.delete({ where: { id: docId } });
  return NextResponse.json({ success: true });
}
