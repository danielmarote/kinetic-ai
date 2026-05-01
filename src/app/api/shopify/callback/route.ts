import { NextResponse } from "next/server";
import { exchangeShopifyCode, verifyShopifyHmac } from "@/lib/shopify";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query: Record<string, string> = {};
  searchParams.forEach((v, k) => { query[k] = v; });

  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  if (!code || !shop || !state) {
    return NextResponse.json({ error: "Missing OAuth parameters" }, { status: 400 });
  }

  // Verify HMAC signature
  if (!verifyShopifyHmac(query)) {
    return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 403 });
  }

  // Decode state to get botId and userId
  let botId: string;
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    botId = decoded.botId;
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  // Exchange code for access token
  const { access_token, scope } = await exchangeShopifyCode(shop, code);

  // Update bot with Shopify credentials
  await db.bot.updateMany({
    where: { id: botId, userId },
    data: {
      shopifyDomain: shop,
      shopifyToken: access_token,
      shopifyScope: scope,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  return NextResponse.redirect(`${appUrl}/dashboard/bots/${botId}?shopify=connected`);
}
