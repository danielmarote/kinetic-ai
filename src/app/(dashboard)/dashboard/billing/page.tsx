import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import { getUserPlan } from "@/lib/bot-limits";
import BillingActions from "./BillingActions";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  let clerkId: string;
  try {
    const authResult = await auth();
    if (!authResult.userId) redirect("/sign-in");
    clerkId = authResult.userId;
  } catch (err: unknown) {
    const code = (err as { digest?: string })?.digest ?? "";
    if (code.startsWith("NEXT_REDIRECT") || code.startsWith("NEXT_NOT_FOUND")) throw err;
    redirect("/sign-in");
  }

  const sp = await searchParams;
  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch {
    // Non-fatal
  }
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? "";
  let user: Awaited<ReturnType<typeof db.user.upsert>>;
  try {
    user = await db.user.upsert({ where: { clerkId }, update: {}, create: { clerkId, email } });
  } catch {
    redirect("/sign-in");
  }
  const plan = await getUserPlan(user.id);
  const planConfig = PLANS[plan];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900 mt-1">Billing</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {sp.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
            🎉 Subscription updated successfully! Your plan is now active.
          </div>
        )}
        {sp.cancelled && (
          <div className="bg-gray-50 border text-gray-600 px-4 py-3 rounded-xl mb-6 text-sm">
            Checkout cancelled. No changes were made.
          </div>
        )}

        {/* Current plan */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{planConfig.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {planConfig.price === 0 ? "Free forever" : `$${planConfig.price}/month`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Plan Limits</p>
              <p className="text-sm text-gray-700 mt-1">{planConfig.limits.bots} bot{planConfig.limits.bots > 1 ? "s" : ""}</p>
              <p className="text-sm text-gray-700">
                {isFinite(planConfig.limits.conversationsPerMonth)
                  ? `${planConfig.limits.conversationsPerMonth} conversations/mo`
                  : "Unlimited conversations"}
              </p>
            </div>
          </div>
          {plan !== "FREE" && <BillingActions />}
        </div>

        {/* Plan comparison */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plans</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["FREE", "STARTER", "GROWTH", "PRO"] as const).map((planKey) => {
            const p = PLANS[planKey];
            const isCurrent = plan === planKey;
            return (
              <div
                key={planKey}
                className={`bg-white rounded-xl border p-5 ${
                  isCurrent ? "border-indigo-400 ring-1 ring-indigo-400" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  {isCurrent && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {p.price === 0 ? "Free" : `$${p.price}`}
                  {p.price > 0 && <span className="text-sm font-normal text-gray-500">/mo</span>}
                </p>
                <ul className="text-xs text-gray-500 space-y-1.5 mt-3">
                  <li>✓ {p.limits.bots} bot{p.limits.bots > 1 ? "s" : ""}</li>
                  <li>✓ {isFinite(p.limits.conversationsPerMonth)
                    ? `${p.limits.conversationsPerMonth} conv/mo`
                    : "Unlimited conversations"}</li>
                  {p.limits.shopifyIntegration && <li>✓ Shopify integration</li>}
                  {p.limits.analytics && <li>✓ Analytics dashboard</li>}
                  {p.limits.whiteLabelApi && <li>✓ White-label + API</li>}
                </ul>

                {!isCurrent && planKey !== "FREE" && (
                  <UpgradeButton plan={planKey} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UpgradeButton({ plan }: { plan: "STARTER" | "GROWTH" | "PRO" }) {
  return (
    <form action="/api/billing/checkout" method="POST" className="mt-4">
      <input type="hidden" name="plan" value={plan} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  "use client";
  return (
    <button
      type="submit"
      className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
    >
      Upgrade
    </button>
  );
}
