import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canUseShopify } from "@/lib/bot-limits";
import { getShopifyProducts, productToText } from "@/lib/shopify";
import { chunkText } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canUseShopify(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Shopify integration requires Starter plan or higher." },
      { status: 403 }
    );
  }

  const bot = await db.bot.findFirst({ where: { id: botId, userId: user.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!bot.shopifyDomain || !bot.shopifyToken) {
    return NextResponse.json(
      { error: "Shopify not connected. Connect your store first." },
      { status: 400 }
    );
  }

  const products = await getShopifyProducts(bot.shopifyDomain, bot.shopifyToken, 100);
  if (products.length === 0) {
    return NextResponse.json({ message: "No products found in your Shopify store." });
  }

  // Delete existing Shopify product document for this bot
  await db.botDocument.deleteMany({ where: { botId, type: "SHOPIFY_PRODUCTS" } });

  // Create new document
  const doc = await db.botDocument.create({
    data: {
      botId,
      type: "SHOPIFY_PRODUCTS",
      name: `Shopify Products (${bot.shopifyDomain})`,
      status: "PROCESSING",
    },
  });

  // Build product text and chunk it
  const allText = products.map(productToText).join("\n\n---\n\n");
  const chunks = chunkText(allText);

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

  return NextResponse.json({
    success: true,
    productsIngested: products.length,
    chunksCreated: chunks.length,
  });
}
