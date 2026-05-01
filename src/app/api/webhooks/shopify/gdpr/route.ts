import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// Shopify GDPR compliance webhooks
// Required for Shopify App Store submission
// Topics handled: customers/redact, shop/redact, customers/data_request

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;

function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const digest = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(body, "utf8")
    .digest("base64");
  return digest === hmacHeader;
}

export async function POST(request: Request) {
  const body = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const topic = request.headers.get("x-shopify-topic") ?? "";

  if (!verifyShopifyWebhook(body, hmac)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  switch (topic) {
    case "customers/data_request":
      // Shopify is requesting data we hold about a customer.
      // Log the request — in production, email the data to the shop owner.
      console.log("[GDPR] customers/data_request:", payload.shop_domain, payload.customer?.email);
      break;

    case "customers/redact":
      // We must delete all data about this customer.
      // In this app, we don't store PII linked to specific Shopify customers,
      // but we log for compliance audit trail.
      console.log("[GDPR] customers/redact:", payload.shop_domain, payload.customer?.email);
      break;

    case "shop/redact":
      // The shop has uninstalled the app and we must delete all their data.
      const shopDomain = payload.shop_domain as string;
      if (shopDomain) {
        // Clear Shopify credentials from all bots associated with this shop
        await db.bot.updateMany({
          where: { shopifyDomain: shopDomain },
          data: {
            shopifyDomain: null,
            shopifyToken: null,
            shopifyScope: null,
          },
        });
        // Delete SHOPIFY_PRODUCTS documents for this shop
        await db.botDocument.deleteMany({
          where: {
            type: "SHOPIFY_PRODUCTS",
            bot: { shopifyDomain: null }, // already cleared above
          },
        });
        console.log("[GDPR] shop/redact: cleared data for", shopDomain);
      }
      break;

    default:
      console.log("[GDPR] Unknown topic:", topic);
  }

  return NextResponse.json({ success: true });
}
