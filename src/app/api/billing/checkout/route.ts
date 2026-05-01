import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe, PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";

const schema = z.object({
  plan: z.enum(["STARTER", "GROWTH", "PRO"]),
});

async function ensureUser(clerkId: string, email: string) {
  return db.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId, email },
  });
}

export async function POST(request: Request) {
  const { userId: clerkId, sessionClaims } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { plan } = parsed.data;
  const planConfig = PLANS[plan];
  if (!planConfig.priceId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 400 });
  }

  const email = (sessionClaims?.email as string) ?? "";
  const user = await ensureUser(clerkId, email);

  // Find or create Stripe customer
  let subscription = await db.subscription.findUnique({
    where: { userId: user.id },
  });

  let customerId: string;
  if (subscription?.stripeCustomerId) {
    customerId = subscription.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email,
      metadata: { clerkId, userId: user.id },
    });
    customerId = customer.id;

    subscription = await db.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeCustomerId: customerId,
        plan: "FREE",
        status: "ACTIVE",
      },
      update: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/billing?cancelled=true`,
    metadata: { userId: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
