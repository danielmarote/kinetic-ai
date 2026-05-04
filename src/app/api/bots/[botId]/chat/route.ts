import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canStartConversation } from "@/lib/bot-limits";
import { trackEvent } from "@/lib/analytics";
import {
  retrieveRelevantChunks,
  generateChatResponse,
  detectOrderLookupIntent,
  shouldEscalate,
} from "@/lib/rag";
import { getShopifyOrder, formatOrderStatus } from "@/lib/shopify";
import { sendEscalationEmail } from "@/lib/email";

export const runtime = "nodejs";

const chatSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;

  const bot = await db.bot.findUnique({ where: { id: botId } });
  if (!bot || !bot.isActive) {
    return NextResponse.json({ error: "Bot not found or inactive" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, message } = parsed.data;

  // Find or create conversation
  let conversation = await db.conversation.findUnique({ where: { sessionId } });
  const isFirstMessage = !conversation;
  if (!conversation) {
    // Check conversation limit before creating
    const { allowed, reason } = await canStartConversation(botId);
    if (!allowed) {
      return NextResponse.json({ error: reason }, { status: 429 });
    }
    conversation = await db.conversation.create({
      data: { botId, sessionId },
    });
    trackEvent("first_message_sent", { botId, sessionId });
  }

  // Load recent conversation history (last 10 messages)
  const history = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  // Store user message
  await db.message.create({
    data: { conversationId: conversation.id, role: "USER", content: message },
  });

  // Detect order lookup intent
  let orderInfo: string | null = null;
  const orderNumber = detectOrderLookupIntent(message);
  if (orderNumber && bot.shopifyDomain && bot.shopifyToken) {
    const order = await getShopifyOrder(bot.shopifyDomain, bot.shopifyToken, orderNumber);
    if (order) {
      orderInfo = formatOrderStatus(order);
    } else {
      orderInfo = `No order found with number #${orderNumber}.`;
    }
  }

  // Retrieve relevant context chunks
  const chunks = await retrieveRelevantChunks(botId, message, 5);

  // Generate response
  const response = await generateChatResponse({
    botName: bot.name,
    persona: bot.persona,
    tone: bot.tone,
    chunks,
    history: history.map((m) => ({ role: m.role.toLowerCase() as "user" | "assistant", content: m.content })),
    userMessage: message,
    orderInfo,
  });

  // Store assistant message
  const assistantMsg = await db.message.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: response,
      sources: chunks.length > 0 ? JSON.stringify(chunks.map((c) => c.id)) : null,
    },
  });

  // Check if escalation is needed
  const needsEscalation = shouldEscalate(response);
  if (needsEscalation && conversation.status === "ACTIVE") {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { status: "ESCALATED" },
    });

    if (bot.escalationEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendEscalationEmail({
        to: bot.escalationEmail,
        botName: bot.name,
        conversationId: conversation.id,
        visitorQuestion: message,
        conversationUrl: `${appUrl}/dashboard/bots/${botId}/conversations/${conversation.id}`,
      }).catch(() => {}); // Don't fail the chat if email fails
    }
  }

  return NextResponse.json({
    message: {
      id: assistantMsg.id,
      role: "assistant",
      content: response,
      sources: chunks.map((c) => c.documentName),
    },
    conversationId: conversation.id,
    escalated: needsEscalation,
  });
}
