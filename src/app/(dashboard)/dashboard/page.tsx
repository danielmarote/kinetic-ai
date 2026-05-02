import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUserPlan } from "@/lib/bot-limits";
import { PLANS } from "@/lib/stripe";

export default async function DashboardPage() {
  // auth() may throw on first load after OAuth redirect in Clerk dev mode —
  // catch and redirect to sign-in to avoid the generic "Application error" page.
  let clerkId: string;
  try {
    const authResult = await auth();
    if (!authResult.userId) redirect("/sign-in");
    clerkId = authResult.userId;
  } catch (err: unknown) {
    // Re-throw Next.js internal redirect/not-found signals
    const code = (err as { digest?: string })?.digest ?? "";
    if (code.startsWith("NEXT_REDIRECT") || code.startsWith("NEXT_NOT_FOUND")) throw err;
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  // Upsert so first-time sign-ins via OAuth automatically create the DB record
  const dbUser = await db.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId, email },
    include: {
      bots: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { conversations: true } } },
      },
    },
  });

  const plan = await getUserPlan(dbUser.id);
  const planConfig = PLANS[plan];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const totalConvsThisMonth = await db.conversation.count({
    where: {
      bot: { userId: dbUser.id },
      createdAt: { gte: startOfMonth },
    },
  });

  const bots = dbUser.bots;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">BotBuilder</h1>
            <p className="text-sm text-gray-500">AI Customer Support</p>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="font-medium text-indigo-600">Dashboard</Link>
            <Link href="/dashboard/billing" className="text-gray-600 hover:text-gray-900">Billing</Link>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome banner */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName ?? "there"}!
          </h2>
          <p className="text-gray-600 mt-1">
            You are on the <span className="font-semibold text-indigo-600">{planConfig.name}</span> plan.
            {plan === "FREE" && (
              <Link href="/dashboard/billing" className="ml-2 text-indigo-600 underline text-sm">
                Upgrade for more features →
              </Link>
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Your Bots</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{bots.length}</p>
            <p className="text-xs text-gray-400 mt-1">of {planConfig.limits.bots} allowed</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Conversations This Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalConvsThisMonth}</p>
            <p className="text-xs text-gray-400 mt-1">
              {isFinite(planConfig.limits.conversationsPerMonth)
                ? `of ${planConfig.limits.conversationsPerMonth} allowed`
                : "Unlimited"}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{planConfig.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {planConfig.price === 0 ? "Free forever" : `$${planConfig.price}/month`}
            </p>
          </div>
        </div>

        {/* Bots list */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Bots</h3>
          {bots.length < planConfig.limits.bots && (
            <Link
              href="/dashboard/bots/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + New Bot
            </Link>
          )}
        </div>

        {bots.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed p-12 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Create your first bot</h4>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Build an AI customer support bot for your Shopify store in under 10 minutes.
            </p>
            <Link
              href="/dashboard/bots/new"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Bot
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bots.map((bot) => (
              <Link
                key={bot.id}
                href={`/dashboard/bots/${bot.id}`}
                className="bg-white rounded-xl border p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: bot.primaryColor }}
                    >
                      {bot.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {bot.name}
                      </h4>
                      <p className="text-xs text-gray-500 capitalize">{bot.tone} tone</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      bot.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {bot.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span>{bot._count.conversations} conversations</span>
                  {bot.shopifyDomain && (
                    <span className="text-green-600">● Shopify connected</span>
                  )}
                </div>
              </Link>
            ))}
            {bots.length < planConfig.limits.bots && (
              <Link
                href="/dashboard/bots/new"
                className="bg-white rounded-xl border border-dashed p-5 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-all"
              >
                <span className="text-2xl mr-2">+</span>
                <span className="font-medium">Add another bot</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
