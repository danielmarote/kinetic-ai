"use client";

import { useState } from "react";

const TONES = ["friendly", "professional", "formal", "casual"];
const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#3b82f6", "#64748b", "#111827",
];

interface BotData {
  id: string;
  name: string;
  persona: string;
  tone: string;
  welcomeMessage: string;
  primaryColor: string;
  escalationEmail: string;
  isActive: boolean;
}

export default function BotSettingsForm({ bot }: { bot: BotData }) {
  const [form, setForm] = useState(bot);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const res = await fetch(`/api/bots/${bot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        persona: form.persona || null,
        tone: form.tone,
        welcomeMessage: form.welcomeMessage,
        primaryColor: form.primaryColor,
        escalationEmail: form.escalationEmail || null,
        isActive: form.isActive,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    await fetch(`/api/bots/${bot.id}`, { method: "DELETE" });
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Bot Settings</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Persona</label>
          <textarea
            value={form.persona}
            onChange={(e) => setForm({ ...form, persona: e.target.value })}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
          <input
            type="text"
            value={form.welcomeMessage}
            onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tone of Voice</label>
          <div className="flex gap-2 flex-wrap">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, tone: t })}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize ${
                  form.tone === t
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Widget Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, primaryColor: color })}
                className={`w-8 h-8 rounded-full transition-transform ${
                  form.primaryColor === color ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Email</label>
          <input
            type="email"
            value={form.escalationEmail}
            onChange={(e) => setForm({ ...form, escalationEmail: e.target.value })}
            placeholder="support@yourstore.com"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`w-11 h-6 rounded-full transition-colors ${
              form.isActive ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
              form.isActive ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
          <span className="text-sm text-gray-700">{form.isActive ? "Bot is active" : "Bot is paused"}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Delete Bot
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
