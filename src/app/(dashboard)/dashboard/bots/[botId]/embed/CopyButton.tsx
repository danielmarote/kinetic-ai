"use client";

import { useState } from "react";

export function CopyButton({ text, botId, onCopied }: { text: string; botId?: string; onCopied?: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopied?.();
    // Track embed_copied event
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "embed_copied", properties: { botId } }),
    }).catch(() => {});
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1 rounded transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
