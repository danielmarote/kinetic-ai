"use client";

import { useEffect, useState } from "react";

const SCRIPT = [
  { role: "user" as const, text: "Where is my order #4821?", ms: 600 },
  { role: "typing" as const, text: "", ms: 1400 },
  { role: "bot" as const, text: "Let me check that for you! 🔍", ms: 2200 },
  { role: "typing" as const, text: "", ms: 3000 },
  { role: "bot" as const, text: "Order #4821 shipped May 27 via USPS. Estimated delivery: May 30. I'll send your tracking link now! 📦", ms: 3800 },
  { role: "user" as const, text: "What's your return policy?", ms: 5600 },
  { role: "typing" as const, text: "", ms: 6400 },
  { role: "bot" as const, text: "Free 30-day returns on everything — no questions asked. Just reply to your order email to start!", ms: 7200 },
];

type Message = { role: "user" | "bot"; text: string };

export function HeroChatMockup() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    SCRIPT.forEach((step) => {
      const t = setTimeout(() => {
        if (step.role === "typing") {
          setTyping(true);
        } else {
          setTyping(false);
          setMessages((prev) => [...prev, { role: step.role, text: step.text }]);
        }
      }, step.ms);
      timers.push(t);
    });

    // Restart loop after all messages shown + pause
    const restart = setTimeout(() => {
      setMessages([]);
      setTyping(false);
      setCycle((c) => c + 1);
    }, 10000);
    timers.push(restart);

    return () => timers.forEach(clearTimeout);
  }, [cycle]); // re-run on each cycle

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Browser chrome */}
      <div className="rounded-2xl shadow-2xl shadow-indigo-200/60 overflow-hidden border border-gray-200 bg-white">
        {/* Chat header */}
        <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            H
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Helply Support</p>
            <p className="text-indigo-200 text-xs">Powered by AI • Always on</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-indigo-200 text-xs">Online</span>
          </div>
        </div>

        {/* Messages area */}
        <div className="p-4 space-y-3 min-h-[280px] max-h-[280px] overflow-hidden bg-gray-50">
          {/* Welcome message */}
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
              H
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-gray-700 shadow-sm max-w-[85%]">
              Hi! I'm Helply. Ask me anything about your order or our store. 👋
            </div>
          </div>

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "bot" && (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                  H
                </div>
              )}
              <div
                className={`px-3 py-2 rounded-2xl text-sm shadow-sm max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-700 rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-start gap-2 animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                H
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-xs text-gray-400">
            Ask anything...
          </div>
          <button className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-3 -right-3 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-gray-600 font-medium">Responding in &lt;1s</span>
      </div>
    </div>
  );
}
