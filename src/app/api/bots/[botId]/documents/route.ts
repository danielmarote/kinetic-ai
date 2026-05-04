import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chunkText } from "@/lib/rag";
import { trackEvent } from "@/lib/analytics";

// Force Node.js runtime (pdf-parse requires it)
export const runtime = "nodejs";
export const maxDuration = 60;

async function getBotForUser(botId: string, clerkId: string) {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  return db.bot.findFirst({ where: { id: botId, userId: user.id } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const bot = await getBotForUser(botId, clerkId);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const documents = await db.botDocument.findMany({
    where: { botId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  return NextResponse.json({ documents });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const bot = await getBotForUser(botId, clerkId);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") ?? "";
  let text = "";
  let docName = "";
  let docType: "PDF" | "URL" | "TEXT" = "TEXT";
  let sourceUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    // PDF upload
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const urlField = formData.get("url") as string | null;
    const textField = formData.get("text") as string | null;
    const nameField = formData.get("name") as string | null;

    if (file && file.size > 0) {
      // PDF parsing
      docType = "PDF";
      docName = nameField ?? file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      // pdf-parse v2 exports the function as the module itself in ESM
      const pdfParseModule = await import("pdf-parse") as any;
      const pdfParseFn = pdfParseModule.default ?? pdfParseModule;
      const parsed = await pdfParseFn(buffer);
      text = parsed.text;
    } else if (urlField) {
      // URL scraping
      docType = "URL";
      sourceUrl = urlField;
      docName = nameField ?? urlField;
      text = await scrapeUrl(urlField);
    } else if (textField) {
      // Raw text
      docType = "TEXT";
      docName = nameField ?? "Text document";
      text = textField;
    }
  } else {
    // JSON body with URL or text
    const body = await request.json();
    if (body.url) {
      docType = "URL";
      sourceUrl = body.url;
      docName = body.name ?? body.url;
      text = await scrapeUrl(body.url);
    } else if (body.text) {
      docType = "TEXT";
      docName = body.name ?? "Text document";
      text = body.text;
    }
  }

  if (!text.trim()) {
    return NextResponse.json({ error: "No text content extracted" }, { status: 400 });
  }

  // Create document record
  const doc = await db.botDocument.create({
    data: {
      botId,
      type: docType,
      name: docName,
      sourceUrl: sourceUrl ?? null,
      status: "PROCESSING",
    },
  });

  // Chunk and store asynchronously (but we await it here for simplicity)
  try {
    const chunks = chunkText(text);
    await db.docChunk.createMany({
      data: chunks.map((content, chunkIndex) => ({
        documentId: doc.id,
        botId,
        content,
        chunkIndex,
      })),
    });

    await db.botDocument.update({
      where: { id: doc.id },
      data: { status: "READY", chunkCount: chunks.length },
    });

    trackEvent("knowledge_base_upload", { botId, docType, chunkCount: chunks.length });

    return NextResponse.json({ document: { ...doc, status: "READY", chunkCount: chunks.length } }, { status: 201 });
  } catch (err) {
    await db.botDocument.update({ where: { id: doc.id }, data: { status: "FAILED" } });
    throw err;
  }
}

async function scrapeUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BotBuilder/1.0 knowledge-base-ingestion" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);

  const html = await res.text();

  // Use cheerio for HTML parsing
  const { load } = await import("cheerio");
  const $ = load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, aside, noscript, iframe, form, button").remove();

  // Extract meaningful text
  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content") ?? "";
  const bodyText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000); // cap at 50k chars

  return [title, metaDesc, bodyText].filter(Boolean).join("\n\n");
}
