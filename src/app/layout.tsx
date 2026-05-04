import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helply — AI Support Chatbot for Shopify",
  description: "The no-code AI chatbot that automatically deflects 45% of support tickets. Built for Shopify & WooCommerce merchants.",
  metadataBase: new URL("https://wearehelply.com"),
  openGraph: {
    title: "Helply — AI Support Chatbot for Shopify",
    description: "Deflect 45% of support tickets automatically. Set up in 5 minutes. No engineers needed.",
    url: "https://wearehelply.com",
    siteName: "Helply",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Helply — AI Support Chatbot for Shopify and WooCommerce",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Helply — AI Support Chatbot for Shopify",
    description: "Deflect 45% of support tickets automatically. Set up in 5 minutes. No engineers needed.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://wearehelply.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
