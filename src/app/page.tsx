import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="font-bold text-xl text-indigo-600">BotBuilder</div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/privacy" className="text-gray-500 hover:text-gray-900">Privacy</Link>
          <Link href="/sign-in" className="text-gray-700 font-medium hover:text-gray-900">Sign In</Link>
          <Link href="/sign-up" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-block bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Built for Shopify & WooCommerce merchants
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
          AI Customer Support<br />
          <span className="text-indigo-600">That Knows Your Store</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Build a custom AI chatbot trained on your products, FAQs, and policies.
          Deploy with one line of code. Handle 80%+ of support automatically.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-up" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Start for Free →
          </Link>
          <Link href="/sign-in" className="border-2 border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-300 transition-colors">
            Sign In
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">No credit card required • Set up in under 10 minutes</p>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Everything you need</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: "🧠", title: "Smart Knowledge Base", desc: "Upload PDFs, URLs, or paste text. Your bot learns from your content." },
              { icon: "🛍️", title: "Shopify Native", desc: "OAuth integration, order status lookup, and product catalog sync." },
              { icon: "💬", title: "1-Line Embed", desc: "Add one script tag to any website. Works on any storefront." },
              { icon: "📈", title: "Analytics", desc: "Track conversations, deflection rate, and top unanswered questions." },
              { icon: "🔀", title: "Human Escalation", desc: "Auto-email your team when the bot can't answer." },
              { icon: "🎨", title: "No-Code Setup", desc: "Customize persona, tone, color, and welcome message. No coding." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border p-5">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="font-semibold text-gray-900 mt-3 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Simple pricing</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Free", price: 0, bots: 1, convs: "50/mo", features: ["Basic chatbot", "URL & PDF ingestion"] },
              { name: "Starter", price: 9, bots: 1, convs: "500/mo", features: ["+ Shopify integration", "+ Order lookup"] },
              { name: "Growth", price: 29, bots: 3, convs: "Unlimited", features: ["+ WooCommerce", "+ Analytics", "3 bots"] },
              { name: "Pro", price: 79, bots: 10, convs: "Unlimited", features: ["+ White-label", "+ API access", "10 bots"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-xl border p-5 ${p.name === "Growth" ? "border-indigo-400 ring-1 ring-indigo-400" : ""}`}>
                {p.name === "Growth" && <div className="text-xs font-semibold text-indigo-600 mb-2">MOST POPULAR</div>}
                <h3 className="font-bold text-gray-900">{p.name}</h3>
                <p className="text-2xl font-bold mt-2 mb-1">
                  {p.price === 0 ? "Free" : `$${p.price}`}
                  {p.price > 0 && <span className="text-sm font-normal text-gray-500">/mo</span>}
                </p>
                <p className="text-xs text-gray-500 mb-3">{p.convs} conversations</p>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  {p.features.map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
                <Link
                  href="/sign-up"
                  className={`block mt-4 text-center py-2 rounded-lg text-sm font-medium transition-colors ${
                    p.name === "Growth"
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© 2026 BotBuilder. All rights reserved.</span>
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        </div>
      </footer>
    </main>
  );
}
