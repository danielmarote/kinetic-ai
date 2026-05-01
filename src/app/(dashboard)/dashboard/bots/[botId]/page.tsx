import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import BotSettingsForm from "./BotSettingsForm";

export default async function BotPage({ params }: { params: Promise<{ botId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { botId } = await params;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) notFound();

  const bot = await db.bot.findFirst({
    where: { id: botId, userId: user.id },
    include: { _count: { select: { conversations: true, documents: true } } },
  });
  if (!bot) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">{bot.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{bot.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              bot.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {bot.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        {/* Sub-navigation */}
        <div className="max-w-4xl mx-auto px-6 flex gap-6 text-sm border-t">
          <Link href={`/dashboard/bots/${botId}`} className="py-3 border-b-2 border-indigo-600 text-indigo-600 font-medium">Settings</Link>
          <Link href={`/dashboard/bots/${botId}/knowledge`} className="py-3 text-gray-500 hover:text-gray-900">Knowledge Base</Link>
          <Link href={`/dashboard/bots/${botId}/analytics`} className="py-3 text-gray-500 hover:text-gray-900">Analytics</Link>
          <Link href={`/dashboard/bots/${botId}/embed`} className="py-3 text-gray-500 hover:text-gray-900">Embed</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* Settings form */}
        <div className="col-span-2">
          <BotSettingsForm bot={{
            id: bot.id,
            name: bot.name,
            persona: bot.persona ?? "",
            tone: bot.tone,
            welcomeMessage: bot.welcomeMessage,
            primaryColor: bot.primaryColor,
            escalationEmail: bot.escalationEmail ?? "",
            isActive: bot.isActive,
          }} />
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Overview</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{bot._count.conversations}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Knowledge Documents</p>
                <p className="text-2xl font-bold text-gray-900">{bot._count.documents}</p>
              </div>
            </div>
          </div>

          {bot.shopifyDomain ? (
            <div className="bg-green-50 rounded-xl border border-green-200 p-5">
              <h3 className="font-semibold text-green-800 mb-1">Shopify Connected</h3>
              <p className="text-xs text-green-600">{bot.shopifyDomain}</p>
              <form action={`/api/bots/${botId}/shopify`} method="POST" className="mt-3">
                <button
                  type="submit"
                  className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Sync Products
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Shopify Integration</h3>
              <p className="text-xs text-gray-500 mb-3">Connect your Shopify store for order lookup and product sync.</p>
              <ShopifyConnectForm botId={botId} />
            </div>
          )}

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Links</h3>
            <div className="space-y-2">
              <Link href={`/dashboard/bots/${botId}/knowledge`} className="block text-sm text-indigo-600 hover:underline">
                → Manage Knowledge Base
              </Link>
              <Link href={`/dashboard/bots/${botId}/embed`} className="block text-sm text-indigo-600 hover:underline">
                → Get Embed Code
              </Link>
              <Link href={`/dashboard/bots/${botId}/analytics`} className="block text-sm text-indigo-600 hover:underline">
                → View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopifyConnectForm({ botId }: { botId: string }) {
  return (
    <form action="/api/shopify/oauth" method="GET">
      <input type="hidden" name="botId" value={botId} />
      <input
        type="text"
        name="shop"
        placeholder="your-store.myshopify.com"
        required
        className="w-full border rounded-lg px-2 py-1.5 text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="w-full text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Connect Shopify Store
      </button>
    </form>
  );
}
