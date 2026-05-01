import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public endpoint — no auth required. Returns only safe display config.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;

  const bot = await db.bot.findUnique({
    where: { id: botId },
    select: {
      id: true,
      name: true,
      welcomeMessage: true,
      primaryColor: true,
      isActive: true,
      tone: true,
    },
  });

  if (!bot || !bot.isActive) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  return NextResponse.json({ bot });
}
