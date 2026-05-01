"use client";

import { useState, useRef, useEffect } from "react";

interface Bot {
  id: string;
  name: string;
  welcomeMessage: string;
  primaryColor: string;
  tone: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function WidgetChat({ bot }: { bot: Bot }) {
  const sessionId = useRef("bb_" + Math.random().toString(36).slice(2) + "_" + Date.now());
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: bot.welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/bots/${bot.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message?.content ?? "Sorry, something went wrong.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const color = bot.primaryColor;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ background: color, color: "white", padding: "16px 20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{bot.name}</h2>
        <p style={{ fontSize: "11px", opacity: 0.8, margin: "2px 0 0" }}>AI Customer Support</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              maxWidth: "80%",
              padding: "10px 14px",
              borderRadius: "12px",
              fontSize: "13px",
              lineHeight: 1.5,
              wordBreak: "break-word",
              ...(msg.role === "user"
                ? { background: color, color: "white", marginLeft: "auto", borderBottomRightRadius: "4px" }
                : { background: "#f3f4f6", color: "#111", borderBottomLeftRadius: "4px" }),
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ background: "#f3f4f6", color: "#888", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", maxWidth: "80%", borderBottomLeftRadius: "4px" }}>
            ...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px", display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          disabled={loading}
          maxLength={2000}
          style={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: color,
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
