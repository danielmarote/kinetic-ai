import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CopyButton } from "./CopyButton";

export default async function EmbedPage({ params }: { params: Promise<{ botId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { botId } = await params;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) notFound();

  const bot = await db.bot.findFirst({ where: { id: botId, userId: user.id } });
  if (!bot) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const embedScript = `<script src="${appUrl}/widget.js" data-bot-id="${botId}" async></script>`;
  const shopifyScript = `{{ '${appUrl}/widget.js' | script_tag }}
<script>
  window.HelplyBotId = "${botId}";
</script>`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/dashboard/bots/${botId}`} className="text-gray-400 hover:text-gray-600 text-sm">{bot.name}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">Embed</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Embed Your Bot</h1>
        </div>
        <div className="max-w-4xl mx-auto px-6 flex gap-6 text-sm border-t">
          <Link href={`/dashboard/bots/${botId}`} className="py-3 text-gray-500 hover:text-gray-900">Settings</Link>
          <Link href={`/dashboard/bots/${botId}/knowledge`} className="py-3 text-gray-500 hover:text-gray-900">Knowledge Base</Link>
          <Link href={`/dashboard/bots/${botId}/analytics`} className="py-3 text-gray-500 hover:text-gray-900">Analytics</Link>
          <Link href={`/dashboard/bots/${botId}/embed`} className="py-3 border-b-2 border-indigo-600 text-indigo-600 font-medium">Embed</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Standard embed */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Standard Embed (Any Website)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Paste this snippet before the <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag on any page.
          </p>
          <EmbedCode code={embedScript} />
        </div>

        {/* Shopify embed */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Shopify Theme Installation</h2>
          <p className="text-sm text-gray-500 mb-4">
            Add this to your Shopify theme&apos;s <code className="bg-gray-100 px-1 rounded">theme.liquid</code> file, before <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code>.
          </p>
          <EmbedCode code={shopifyScript} language="liquid" />

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Shopify App Installation</h3>
            <p className="text-xs text-blue-700 mb-3">
              For a more integrated experience, install via Shopify OAuth to enable order lookup.
            </p>
            {bot.shopifyDomain ? (
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm">✓ Connected to {bot.shopifyDomain}</span>
              </div>
            ) : (
              <ShopifyInstallForm botId={botId} />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Preview Your Bot</h2>
          <p className="text-sm text-gray-500 mb-4">
            Test your bot before deploying it to your store.
          </p>
          <Link
            href={`/widget/${botId}`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Open Preview →
          </Link>
        </div>

        {/* Bot info */}
        <div className="bg-gray-50 rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Bot Configuration</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>ID: <code className="font-mono">{botId}</code></div>
            <div>Tone: <span className="capitalize">{bot.tone}</span></div>
            <div>Status: {bot.isActive ? "Active" : "Inactive"}</div>
            <div>Color: <span style={{ color: bot.primaryColor }}>{bot.primaryColor}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedCode({ code, language = "html" }: { code: string; language?: string }) {
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}


function ShopifyInstallForm({ botId }: { botId: string }) {
  return (
    <form action="/api/shopify/oauth" method="GET" className="flex gap-2">
      <input type="hidden" name="botId" value={botId} />
      <input
        type="text"
        name="shop"
        placeholder="your-store.myshopify.com"
        required
        className="flex-1 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap"
      >
        Install via Shopify
      </button>
    </form>
  );
}
