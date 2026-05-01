import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import WidgetChat from "./WidgetChat";

export default async function WidgetPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;

  const bot = await db.bot.findUnique({
    where: { id: botId },
    select: {
      id: true,
      name: true,
      welcomeMessage: true,
      primaryColor: true,
      isActive: true,
      tone: true,
    },
  });

  if (!bot || !bot.isActive) notFound();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{bot.name} — Chat Support</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; height: 100vh; display: flex; flex-direction: column; }
        `}</style>
      </head>
      <body>
        <WidgetChat bot={bot} />
      </body>
    </html>
  );
}
