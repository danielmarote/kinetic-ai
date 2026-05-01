import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Document Chunking ─────────────────────────────────────────────────────

const CHUNK_SIZE = 800;   // characters per chunk
const CHUNK_OVERLAP = 100; // overlap between chunks

export function chunkText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= CHUNK_SIZE) return [cleaned];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    let chunkEnd = end;

    // Try to break at a sentence boundary
    if (end < cleaned.length) {
      const lastPeriod = cleaned.lastIndexOf(".", end);
      const lastNewline = cleaned.lastIndexOf("\n", end);
      const breakAt = Math.max(lastPeriod, lastNewline);
      if (breakAt > start + CHUNK_SIZE / 2) {
        chunkEnd = breakAt + 1;
      }
    }

    chunks.push(cleaned.slice(start, chunkEnd).trim());
    start = chunkEnd - CHUNK_OVERLAP;
    if (start < 0) start = 0;
  }

  return chunks.filter((c) => c.length > 20);
}

// ─── Retrieval (PostgreSQL full-text search) ────────────────────────────────

export interface RetrievedChunk {
  id: string;
  content: string;
  documentName: string;
}

export async function retrieveRelevantChunks(
  botId: string,
  query: string,
  topK = 5
): Promise<RetrievedChunk[]> {
  // Use PostgreSQL full-text search via raw query
  const results = await db.$queryRaw<
    Array<{ id: string; content: string; document_name: string; rank: number }>
  >`
    SELECT
      dc.id,
      dc.content,
      bd.name AS document_name,
      ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', ${query})) AS rank
    FROM "DocChunk" dc
    JOIN "BotDocument" bd ON bd.id = dc."documentId"
    WHERE dc."botId" = ${botId}
      AND bd.status = 'READY'
      AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT ${topK}
  `;

  // If FTS returns no results, fall back to recent chunks (broad match)
  if (results.length === 0) {
    const fallback = await db.docChunk.findMany({
      where: { botId, document: { status: "READY" } },
      include: { document: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: topK,
    });
    return fallback.map((c) => ({
      id: c.id,
      content: c.content,
      documentName: c.document.name,
    }));
  }

  return results.map((r) => ({
    id: r.id,
    content: r.content,
    documentName: r.document_name,
  }));
}

// ─── Order Detection ───────────────────────────────────────────────────────

export function detectOrderLookupIntent(message: string): string | null {
  // Match patterns like "order 1001", "#1001", "order number 1001"
  const match = message.match(/(?:order\s*(?:number|#)?\s*#?)(\d{4,})/i);
  return match ? match[1] : null;
}

// ─── Claude Completion ─────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  botName: string;
  persona?: string | null;
  tone?: string;
  chunks: RetrievedChunk[];
  history: ChatMessage[];
  userMessage: string;
  orderInfo?: string | null;
}

export async function generateChatResponse(opts: ChatCompletionOptions): Promise<string> {
  const { botName, persona, tone, chunks, history, userMessage, orderInfo } = opts;

  const toneDescriptions: Record<string, string> = {
    friendly: "warm, friendly, and conversational",
    professional: "professional and concise",
    formal: "formal and courteous",
    casual: "casual and relaxed",
  };
  const toneDesc = toneDescriptions[tone ?? "friendly"] ?? "helpful";

  // Build context from retrieved chunks
  const contextSection =
    chunks.length > 0
      ? `## Knowledge Base\n${chunks.map((c, i) => `[${i + 1}] ${c.documentName}: ${c.content}`).join("\n\n")}`
      : "";

  const orderSection = orderInfo ? `## Order Information\n${orderInfo}` : "";

  const systemPrompt = [
    `You are ${botName}, an AI customer support assistant.`,
    persona ? `Your personality: ${persona}` : "",
    `Your tone: Be ${toneDesc}.`,
    ``,
    `RULES:`,
    `- Answer questions using the provided knowledge base context.`,
    `- For order status queries, use the order information provided.`,
    `- If you don't know the answer, say so honestly and offer to connect the customer with a human agent.`,
    `- Keep responses concise (2-4 sentences when possible).`,
    `- Never make up information about products, prices, or policies.`,
    `- If the customer seems frustrated or the issue is complex, suggest human escalation.`,
    contextSection,
    orderSection,
  ]
    .filter(Boolean)
    .join("\n");

  // Build message history with prompt caching on system prompt
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  messages.push({ role: "user", content: userMessage });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: systemPrompt,
        // Enable prompt caching for cost efficiency on long system prompts
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "I'm sorry, I couldn't generate a response.";
}

// ─── Escalation Detection ──────────────────────────────────────────────────

export function shouldEscalate(response: string): boolean {
  const escalationPhrases = [
    "connect you with a human",
    "human agent",
    "human support",
    "speak with someone",
    "talk to a person",
    "escalate",
    "transfer you",
    "don't have that information",
    "cannot help",
    "reach out to our team",
  ];
  const lower = response.toLowerCase();
  return escalationPhrases.some((p) => lower.includes(p));
}
