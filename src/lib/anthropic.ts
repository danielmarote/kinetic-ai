import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function streamText(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 4096
) {
  const stream = anthropic.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  return stream;
}
