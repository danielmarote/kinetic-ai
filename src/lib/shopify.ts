const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES ?? "read_orders,read_products,read_customers";

// ─── OAuth ─────────────────────────────────────────────────────────────────

export function buildShopifyOAuthUrl(shop: string, state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
    "grant_options[]": "per-user",
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeShopifyCode(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify OAuth token exchange failed: ${text}`);
  }

  return res.json();
}

export function verifyShopifyHmac(query: Record<string, string>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("&");

  const crypto = require("crypto");
  const digest = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return digest === hmac;
}

// ─── Orders ────────────────────────────────────────────────────────────────

export interface ShopifyOrder {
  id: number;
  name: string; // e.g. "#1001"
  email: string;
  financial_status: string;
  fulfillment_status: string | null;
  created_at: string;
  total_price: string;
  currency: string;
  fulfillments: Array<{
    tracking_number: string | null;
    tracking_url: string | null;
    shipment_status: string | null;
  }>;
  line_items: Array<{
    title: string;
    quantity: number;
    price: string;
  }>;
}

export async function getShopifyOrder(
  shop: string,
  accessToken: string,
  orderName: string
): Promise<ShopifyOrder | null> {
  // orderName can be like "1001" or "#1001"
  const query = orderName.replace("#", "");
  const res = await fetch(
    `https://${shop}/admin/api/2024-01/orders.json?name=${encodeURIComponent(query)}&status=any&fields=id,name,email,financial_status,fulfillment_status,created_at,total_price,currency,fulfillments,line_items`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const orders: ShopifyOrder[] = data.orders ?? [];
  return orders[0] ?? null;
}

export function formatOrderStatus(order: ShopifyOrder): string {
  const lines = [
    `**Order ${order.name}**`,
    `Status: ${order.financial_status}`,
    `Fulfillment: ${order.fulfillment_status ?? "unfulfilled"}`,
    `Total: ${order.currency} ${order.total_price}`,
  ];

  if (order.fulfillments?.length > 0) {
    const f = order.fulfillments[0];
    if (f.tracking_number) {
      lines.push(`Tracking: ${f.tracking_number}`);
    }
    if (f.tracking_url) {
      lines.push(`Track your package: ${f.tracking_url}`);
    }
  }

  return lines.join("\n");
}

// ─── Products ──────────────────────────────────────────────────────────────

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  handle: string;
  product_type: string;
  tags: string;
  variants: Array<{
    price: string;
    title: string;
    available: boolean;
  }>;
}

export async function getShopifyProducts(
  shop: string,
  accessToken: string,
  limit = 100
): Promise<ShopifyProduct[]> {
  const res = await fetch(
    `https://${shop}/admin/api/2024-01/products.json?limit=${limit}&fields=id,title,body_html,handle,product_type,tags,variants`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.products ?? [];
}

export function productToText(product: ShopifyProduct): string {
  const price =
    product.variants?.[0]?.price
      ? `Price: $${product.variants[0].price}`
      : "";
  const tags = product.tags ? `Tags: ${product.tags}` : "";
  const body = product.body_html
    ? product.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  return [
    `Product: ${product.title}`,
    product.product_type ? `Type: ${product.product_type}` : "",
    price,
    tags,
    body,
  ]
    .filter(Boolean)
    .join("\n");
}
