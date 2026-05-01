import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildShopifyOAuthUrl } from "@/lib/shopify";
import { canUseShopify } from "@/lib/bot-limits";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canUseShopify(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Shopify integration requires Starter plan or higher." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");
  const botId = searchParams.get("botId");

  if (!shop || !botId) {
    return NextResponse.json({ error: "Missing shop or botId" }, { status: 400 });
  }

  // Validate shop domain format
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    return NextResponse.json({ error: "Invalid Shopify store domain" }, { status: 400 });
  }

  const bot = await db.bot.findFirst({ where: { id: botId, userId: user.id } });
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  // State encodes botId + userId for validation in callback
  const state = Buffer.from(JSON.stringify({ botId, userId: user.id })).toString("base64url");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const redirectUri = `${appUrl}/api/shopify/callback`;

  const oauthUrl = buildShopifyOAuthUrl(shop, state, redirectUri);
  return NextResponse.redirect(oauthUrl);
}
