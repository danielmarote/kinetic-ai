"use client";

import { useState } from "react";

export default function BillingActions() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(false);
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="mt-4 text-sm text-indigo-600 hover:underline disabled:opacity-50"
    >
      {loading ? "Loading..." : "Manage subscription in Stripe →"}
    </button>
  );
}
