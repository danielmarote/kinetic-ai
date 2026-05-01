import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

function priceIdToPlan(priceId: string): "FREE" | "STARTER" | "GROWTH" | "PRO" {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return "GROWTH";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  return "FREE";
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const customerId = session.customer as string;
      const priceId = subscription.items.data[0].price.id;
      const plan = priceIdToPlan(priceId);

      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: "ACTIVE",
          plan,
        },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;
      const plan = priceIdToPlan(priceId);

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          plan,
          status: "ACTIVE",
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: "CANCELLED", plan: "FREE" },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const plan = priceIdToPlan(priceId);
      const status = subscription.status === "active" ? "ACTIVE"
        : subscription.status === "past_due" ? "PAST_DUE"
        : subscription.status === "trialing" ? "TRIALING"
        : "ACTIVE";

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          plan,
          status,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
