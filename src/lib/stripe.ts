import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    priceId: null,
    limits: {
      requestsPerMonth: 10,
    },
  },
  STARTER: {
    name: "Starter",
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER,
    limits: {
      requestsPerMonth: 500,
    },
  },
  PRO: {
    name: "Pro",
    price: 99,
    priceId: process.env.STRIPE_PRICE_PRO,
    limits: {
      requestsPerMonth: 5000,
    },
  },
} as const;

export type PlanName = keyof typeof PLANS;
