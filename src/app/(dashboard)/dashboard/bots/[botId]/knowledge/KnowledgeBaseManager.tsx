"use client";

import { useState, useRef } from "react";

interface Document {
  id: string;
  name: string;
  type: string;
  status: string;
  sourceUrl?: string;
  chunkCount: number;
  createdAt: string;
}

export default function KnowledgeBaseManager({
  botId,
  documents: initialDocs,
}: {
  botId: string;
  documents: Document[];
}) {
  const [docs, setDocs] = useState(initialDocs);
  const [activeTab, setActiveTab] = useState<"url" | "pdf" | "text">("url");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [textName, setTextName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function ingestUrl() {
    if (!urlInput.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/bots/${botId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput.trim(), name: urlInput.trim() }),
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to ingest URL");
    } else {
      setDocs((prev) => [
        {
          id: data.document.id,
          name: data.document.name,
          type: data.document.type,
          status: data.document.status,
          sourceUrl: data.document.sourceUrl,
          chunkCount: data.document.chunkCount ?? 0,
          createdAt: data.document.createdAt,
        },
        ...prev,
      ]);
      setUrlInput("");
    }
  }

  async function ingestPdf() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);

    const res = await fetch(`/api/bots/${botId}/documents`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to ingest PDF");
    } else {
      setDocs((prev) => [
        {
          id: data.document.id,
          name: data.document.name,
          type: data.document.type,
          status: data.document.status,
          chunkCount: data.document.chunkCount ?? 0,
          createdAt: data.document.createdAt,
        },
        ...prev,
      ]);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function ingestText() {
    if (!textInput.trim()) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("text", textInput.trim());
    formData.append("name", textName.trim() || "Text document");

    const res = await fetch(`/api/bots/${botId}/documents`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save text");
    } else {
      setDocs((prev) => [
        {
          id: data.document.id,
          name: data.document.name,
          type: data.document.type,
          status: data.document.status,
          chunkCount: data.document.chunkCount ?? 0,
          createdAt: data.document.createdAt,
        },
        ...prev,
      ]);
      setTextInput("");
      setTextName("");
    }
  }

  async function deleteDoc(docId: string) {
    if (!confirm("Remove this document?")) return;
    await fetch(`/api/bots/${botId}/documents/${docId}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  const docTypeIcon: Record<string, string> = {
    URL: "🔗",
    PDF: "📄",
    TEXT: "📝",
    SHOPIFY_PRODUCTS: "🛍️",
  };

  return (
    <div className="space-y-6">
      {/* Add document */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Add Knowledge</h2>

        <div className="flex gap-2 mb-4 border-b">
          {(["url", "pdf", "text"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "url" ? "Website URL" : tab === "pdf" ? "Upload PDF" : "Paste Text"}
            </button>
          ))}
        </div>

        {activeTab === "url" && (
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://yourstore.com/faq"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && ingestUrl()}
            />
            <button
              onClick={ingestUrl}
              disabled={loading || !urlInput.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Adding..." : "Add URL"}
            </button>
          </div>
        )}

        {activeTab === "pdf" && (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="w-full border rounded-lg px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:cursor-pointer"
            />
            <button
              onClick={ingestPdf}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Processing PDF..." : "Upload & Process PDF"}
            </button>
          </div>
        )}

        {activeTab === "text" && (
          <div className="space-y-3">
            <input
              type="text"
              value={textName}
              onChange={(e) => setTextName(e.target.value)}
              placeholder="Document name (e.g. FAQs, Shipping Policy)"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your FAQ content, policies, product descriptions..."
              rows={6}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={ingestText}
              disabled={loading || !textInput.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : "Save Text"}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Document list */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Documents ({docs.length})</h2>
          <p className="text-xs text-gray-500">
            {docs.reduce((sum, d) => sum + d.chunkCount, 0)} total chunks indexed
          </p>
        </div>

        {docs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No documents yet. Add your FAQs, product info, or policies above.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {docs.map((doc) => (
              <li key={doc.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{docTypeIcon[doc.type] ?? "📄"}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        doc.status === "READY" ? "bg-green-100 text-green-700"
                          : doc.status === "PROCESSING" ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {doc.status}
                      </span>
                      {doc.status === "READY" && (
                        <span className="text-xs text-gray-400">{doc.chunkCount} chunks</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteDoc(doc.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors text-sm"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
