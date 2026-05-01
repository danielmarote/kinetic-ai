import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

async function getBotForUser(botId: string, clerkId: string) {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  return db.bot.findFirst({ where: { id: botId, userId: user.id } });
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  persona: z.string().max(500).nullable().optional(),
  tone: z.enum(["friendly", "professional", "formal", "casual"]).optional(),
  welcomeMessage: z.string().max(300).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  escalationEmail: z.string().email().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const bot = await getBotForUser(botId, clerkId);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const full = await db.bot.findUnique({
    where: { id: botId },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      _count: { select: { conversations: true } },
    },
  });

  return NextResponse.json({ bot: full });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const bot = await getBotForUser(botId, clerkId);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.bot.update({
    where: { id: botId },
    data: parsed.data,
  });

  return NextResponse.json({ bot: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const bot = await getBotForUser(botId, clerkId);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.bot.delete({ where: { id: botId } });
  return NextResponse.json({ success: true });
}
