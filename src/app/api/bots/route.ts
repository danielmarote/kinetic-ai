import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canCreateBot } from "@/lib/bot-limits";

const createBotSchema = z.object({
  name: z.string().min(1).max(100),
  persona: z.string().max(500).optional(),
  tone: z.enum(["friendly", "professional", "formal", "casual"]).default("friendly"),
  welcomeMessage: z.string().max(300).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  escalationEmail: z.string().email().optional().or(z.literal("")),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await db.bot.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

async function ensureUser(clerkId: string, email: string) {
  return db.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId, email },
  });
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ bots: [] });

  const bots = await db.bot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { conversations: true, documents: true } },
    },
  });

  return NextResponse.json({ bots });
}

export async function POST(request: Request) {
  const { userId: clerkId, sessionClaims } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = (sessionClaims?.email as string) ?? "";
  const user = await ensureUser(clerkId, email);

  const { allowed, reason } = await canCreateBot(user.id);
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createBotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, persona, tone, welcomeMessage, primaryColor, escalationEmail } = parsed.data;
  const baseSlug = slugify(name);
  const slug = await ensureUniqueSlug(baseSlug);

  const bot = await db.bot.create({
    data: {
      userId: user.id,
      name,
      slug,
      persona: persona ?? null,
      tone,
      welcomeMessage: welcomeMessage ?? "Hi! How can I help you today?",
      primaryColor,
      escalationEmail: escalationEmail || null,
    },
  });

  return NextResponse.json({ bot }, { status: 201 });
}
