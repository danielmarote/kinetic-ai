import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canUseAnalytics } from "@/lib/bot-limits";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bot = await db.bot.findFirst({ where: { id: botId, userId: user.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check analytics access (GROWTH+ plans)
  const hasAnalytics = await canUseAnalytics(user.id);

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30"), 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [totalConversations, escalatedCount, resolvedCount, conversationsByDay] = await Promise.all([
    db.conversation.count({ where: { botId, createdAt: { gte: since } } }),
    db.conversation.count({ where: { botId, status: "ESCALATED", createdAt: { gte: since } } }),
    db.conversation.count({ where: { botId, status: "RESOLVED", createdAt: { gte: since } } }),
    hasAnalytics
      ? db.$queryRaw<Array<{ date: string; count: bigint }>>`
          SELECT
            DATE("createdAt") as date,
            COUNT(*) as count
          FROM "Conversation"
          WHERE "botId" = ${botId}
            AND "createdAt" >= ${since}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `
      : Promise.resolve([]),
  ]);

  const deflectionRate =
    totalConversations > 0
      ? Math.round(((totalConversations - escalatedCount) / totalConversations) * 100)
      : 0;

  return NextResponse.json({
    totalConversations,
    escalatedCount,
    resolvedCount,
    deflectionRate,
    conversationsByDay: conversationsByDay.map((r) => ({
      date: r.date,
      count: Number(r.count),
    })),
    hasAnalytics,
    period: { days, since },
  });
}
