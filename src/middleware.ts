import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  // Stripe webhooks
  "/api/webhooks(.*)",
  // Shopify OAuth callback (Shopify redirects here without user session)
  "/api/shopify/callback(.*)",
  // Public widget endpoints — accessed by embedded script on merchant storefronts
  "/api/bots/(.*)/chat",
  "/api/bots/(.*)/config",
  // Widget preview page — shown in iframe or standalone
  "/widget(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname = "/sign-in";
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
