import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

const schema = z.object({
  event: z.string(),
  properties: z.record(z.unknown()).optional(),
});

// Client-side event ingestion endpoint (e.g. embed_copied from the browser)
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  trackEvent(parsed.data.event as AnalyticsEvent, parsed.data.properties);
  return NextResponse.json({ ok: true });
}
