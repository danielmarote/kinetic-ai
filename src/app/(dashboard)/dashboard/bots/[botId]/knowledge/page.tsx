import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import KnowledgeBaseManager from "./KnowledgeBaseManager";

export default async function KnowledgePage({ params }: { params: Promise<{ botId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { botId } = await params;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) notFound();

  const bot = await db.bot.findFirst({ where: { id: botId, userId: user.id } });
  if (!bot) notFound();

  const documents = await db.botDocument.findMany({
    where: { botId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/dashboard/bots/${botId}`} className="text-gray-400 hover:text-gray-600 text-sm">{bot.name}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">Knowledge Base</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Knowledge Base</h1>
        </div>
        <div className="max-w-4xl mx-auto px-6 flex gap-6 text-sm border-t">
          <Link href={`/dashboard/bots/${botId}`} className="py-3 text-gray-500 hover:text-gray-900">Settings</Link>
          <Link href={`/dashboard/bots/${botId}/knowledge`} className="py-3 border-b-2 border-indigo-600 text-indigo-600 font-medium">Knowledge Base</Link>
          <Link href={`/dashboard/bots/${botId}/analytics`} className="py-3 text-gray-500 hover:text-gray-900">Analytics</Link>
          <Link href={`/dashboard/bots/${botId}/embed`} className="py-3 text-gray-500 hover:text-gray-900">Embed</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <KnowledgeBaseManager
          botId={botId}
          documents={documents.map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            status: d.status,
            sourceUrl: d.sourceUrl ?? undefined,
            chunkCount: d._count.chunks,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
