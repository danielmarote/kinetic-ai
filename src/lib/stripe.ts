import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    priceId: null,
    limits: {
      bots: 1,
      conversationsPerMonth: 50,
      shopifyIntegration: false,
      analytics: false,
      whiteLabelApi: false,
    },
  },
  STARTER: {
    name: "Starter",
    price: 9,
    priceId: process.env.STRIPE_PRICE_STARTER,
    limits: {
      bots: 1,
      conversationsPerMonth: 500,
      shopifyIntegration: true,
      analytics: false,
      whiteLabelApi: false,
    },
  },
  GROWTH: {
    name: "Growth",
    price: 29,
    priceId: process.env.STRIPE_PRICE_GROWTH,
    limits: {
      bots: 3,
      conversationsPerMonth: Infinity,
      shopifyIntegration: true,
      analytics: true,
      whiteLabelApi: false,
    },
  },
  PRO: {
    name: "Pro",
    price: 79,
    priceId: process.env.STRIPE_PRICE_PRO,
    limits: {
      bots: 10,
      conversationsPerMonth: Infinity,
      shopifyIntegration: true,
      analytics: true,
      whiteLabelApi: true,
    },
  },
} as const;

export type PlanName = keyof typeof PLANS;
