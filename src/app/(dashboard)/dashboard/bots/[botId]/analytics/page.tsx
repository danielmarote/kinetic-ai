import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { canUseAnalytics, getUserPlan } from "@/lib/bot-limits";

export default async function AnalyticsPage({ params }: { params: Promise<{ botId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { botId } = await params;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) notFound();

  const bot = await db.bot.findFirst({ where: { id: botId, userId: user.id } });
  if (!bot) notFound();

  const hasAnalytics = await canUseAnalytics(user.id);
  const plan = await getUserPlan(user.id);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [total, escalated, resolved] = await Promise.all([
    db.conversation.count({ where: { botId, createdAt: { gte: since30 } } }),
    db.conversation.count({ where: { botId, status: "ESCALATED", createdAt: { gte: since30 } } }),
    db.conversation.count({ where: { botId, status: "RESOLVED", createdAt: { gte: since30 } } }),
  ]);

  const deflectionRate = total > 0 ? Math.round(((total - escalated) / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/dashboard/bots/${botId}`} className="text-gray-400 hover:text-gray-600 text-sm">{bot.name}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">Analytics</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        </div>
        <div className="max-w-4xl mx-auto px-6 flex gap-6 text-sm border-t">
          <Link href={`/dashboard/bots/${botId}`} className="py-3 text-gray-500 hover:text-gray-900">Settings</Link>
          <Link href={`/dashboard/bots/${botId}/knowledge`} className="py-3 text-gray-500 hover:text-gray-900">Knowledge Base</Link>
          <Link href={`/dashboard/bots/${botId}/analytics`} className="py-3 border-b-2 border-indigo-600 text-indigo-600 font-medium">Analytics</Link>
          <Link href={`/dashboard/bots/${botId}/embed`} className="py-3 text-gray-500 hover:text-gray-900">Embed</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {!hasAnalytics && plan !== "GROWTH" && plan !== "PRO" && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-indigo-900 mb-2">Unlock Full Analytics</h3>
            <p className="text-sm text-indigo-700 mb-4">
              Upgrade to Growth or Pro to access detailed conversation trends, daily charts, and more.
            </p>
            <Link
              href="/dashboard/billing"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Upgrade Plan
            </Link>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">Last 30 days</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Conversations" value={total} />
          <StatCard label="Deflection Rate" value={`${deflectionRate}%`} />
          <StatCard label="Escalated" value={escalated} />
          <StatCard label="Resolved" value={resolved} />
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Conversation Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active / Unresolved</span>
              <span className="font-medium">{total - resolved - escalated}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Resolved by Bot</span>
              <span className="font-medium text-green-600">{resolved}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Escalated to Human</span>
              <span className="font-medium text-orange-600">{escalated}</span>
            </div>
          </div>

          {total > 0 && (
            <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-400 transition-all"
                style={{ width: `${Math.round((resolved / total) * 100)}%` }}
              />
              <div
                className="h-full bg-orange-400 transition-all"
                style={{ width: `${Math.round((escalated / total) * 100)}%` }}
              />
              <div className="h-full bg-gray-300 flex-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
