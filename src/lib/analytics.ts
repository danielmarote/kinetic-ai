/**
 * Lightweight analytics event tracking.
 * Events are emitted as structured JSON to stdout (captured by Vercel log drains).
 * Pipe to PostHog / Mixpanel / Segment via a Vercel log drain when ready.
 */

export type AnalyticsEvent =
  | "signup"
  | "bot_created"
  | "knowledge_base_upload"
  | "first_message_sent"
  | "embed_copied";

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
) {
  console.log(
    JSON.stringify({
      helply_event: event,
      ...properties,
      ts: new Date().toISOString(),
    })
  );
}
