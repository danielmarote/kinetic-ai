"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-2 right-2 text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1 rounded transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
