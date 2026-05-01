import { db } from "@/lib/db";
import { PLANS, type PlanName } from "@/lib/stripe";

/**
 * Get the current plan for a user (defaults to FREE if no subscription).
 */
export async function getUserPlan(userId: string): Promise<PlanName> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });
  if (!subscription || subscription.status === "CANCELLED") return "FREE";
  return subscription.plan as PlanName;
}

/**
 * Check whether the user can create another bot given their current plan.
 */
export async function canCreateBot(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId);
  const limit = PLANS[plan].limits.bots;
  const count = await db.bot.count({ where: { userId } });
  if (count >= limit) {
    return {
      allowed: false,
      reason: `Your ${PLANS[plan].name} plan allows ${limit} bot${limit === 1 ? "" : "s"}. Upgrade to create more.`,
    };
  }
  return { allowed: true };
}

/**
 * Check whether a bot can start a new conversation this month.
 */
export async function canStartConversation(botId: string): Promise<{ allowed: boolean; reason?: string }> {
  const bot = await db.bot.findUnique({ where: { id: botId }, select: { userId: true } });
  if (!bot) return { allowed: false, reason: "Bot not found." };

  const plan = await getUserPlan(bot.userId);
  const limit = PLANS[plan].limits.conversationsPerMonth;
  if (!isFinite(limit)) return { allowed: true };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await db.conversation.count({
    where: { botId, createdAt: { gte: startOfMonth } },
  });

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Monthly conversation limit (${limit}) reached. Upgrade for more.`,
    };
  }
  return { allowed: true };
}

/**
 * Check whether a plan includes Shopify integration.
 */
export async function canUseShopify(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return PLANS[plan].limits.shopifyIntegration;
}

/**
 * Check whether a plan includes analytics.
 */
export async function canUseAnalytics(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return PLANS[plan].limits.analytics;
}
