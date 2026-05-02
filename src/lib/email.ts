import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_...") || key === "re_placeholder") {
    return null;
  }
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com";

export interface EscalationEmailParams {
  to: string;
  botName: string;
  conversationId: string;
  visitorQuestion: string;
  conversationUrl: string;
}

export async function sendEscalationEmail(params: EscalationEmailParams) {
  const resend = getResend();
  if (!resend) return; // email not configured yet
  const { to, botName, conversationId, visitorQuestion, conversationUrl } = params;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `[${botName}] Customer needs human support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Human Support Requested</h2>
        <p>A customer chatting with your bot <strong>${botName}</strong> has requested human assistance.</p>

        <div style="background: #f8f9fa; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <strong>Their last message:</strong>
          <p style="margin: 8px 0 0; color: #333;">${visitorQuestion}</p>
        </div>

        <p>
          <a href="${conversationUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Conversation
          </a>
        </p>

        <p style="color: #666; font-size: 13px;">
          Conversation ID: ${conversationId}
        </p>
      </div>
    `,
  });
}

export interface WelcomeEmailParams {
  to: string;
  name: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const resend = getResend();
  if (!resend) return; // email not configured yet
  const { to, name } = params;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Helply — your AI customer support tool",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome, ${name}!</h2>
        <p>You're now set up with Helply. Here's how to get started in under 5 minutes:</p>
        <ol>
          <li>Create your first bot</li>
          <li>Upload your FAQs or point to your store URL</li>
          <li>Connect your Shopify store</li>
          <li>Copy the embed snippet to your storefront</li>
        </ol>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </p>
      </div>
    `,
  });
}
