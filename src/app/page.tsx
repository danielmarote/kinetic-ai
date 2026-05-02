import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="font-bold text-xl text-indigo-600">Helply</div>
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
          Built for Shopify &amp; WooCommerce merchants
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
          Stop Answering the Same Questions.<br />
          <span className="text-indigo-600">Let Helply Do It.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          For small Shopify and WooCommerce merchants drowning in repetitive customer emails — Helply is the no-code AI chatbot that automatically deflects <strong className="text-gray-700">45% of support tickets</strong> at a flat $29/mo.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-up" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Start for Free →
          </Link>
          <Link href="/sign-in" className="border-2 border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-300 transition-colors">
            Sign In
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">No credit card required • Set up in 5 minutes</p>
      </div>

      {/* Social proof bar */}
      <div className="bg-indigo-600 py-6">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8 text-white text-center">
          <div>
            <p className="text-3xl font-extrabold">45%</p>
            <p className="text-sm opacity-80">support tickets deflected</p>
          </div>
          <div className="hidden md:block w-px h-10 bg-white/30" />
          <div>
            <p className="text-3xl font-extrabold">5 min</p>
            <p className="text-sm opacity-80">average setup time</p>
          </div>
          <div className="hidden md:block w-px h-10 bg-white/30" />
          <div>
            <p className="text-3xl font-extrabold">$29/mo</p>
            <p className="text-sm opacity-80">flat rate, no per-ticket fees</p>
          </div>
        </div>
      </div>

      {/* Feature sections */}
      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20">
        {/* Feature 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-4xl mb-4">🧠</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Store. Your Answers.</h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Upload your FAQs, policies, and product docs. Helply learns your store and answers customer questions in your voice — shipping times, return policies, product details, all of it.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 space-y-3">
            {["Upload PDFs, paste URLs, or type your policies", "Bot learns from your content in seconds", "Handles: refunds, sizing, shipping, product questions", "Answers update when you update your docs"].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="md:order-2">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Status. Without the Wait.</h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Connect Helply to your Shopify store and it looks up real order status in real time. Customers ask, Helply answers — no human needed, no ticket opened.
            </p>
          </div>
          <div className="md:order-1 bg-gray-50 rounded-2xl p-8 space-y-3">
            {["One-click Shopify OAuth connection", "Live order status via Shopify Admin API", "Handles tracking, delivery estimates, cancellations", "Works 24/7 — even when you&apos;re offline"].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </div>
            ))}
          </div>
        </div>

        {/* Feature 3 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Setup in 5 Minutes. Not 5 Days.</h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              No engineers, no integrations team, no enterprise contract. Create your bot, add your content, paste one script tag. Done. Your customers are supported before lunch.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 space-y-3">
            {["No-code bot builder — configure in your browser", "One script tag to embed on any storefront", "Customize name, tone, color, and welcome message", "Human escalation via email when needed"].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Simple, flat pricing</h2>
          <p className="text-center text-gray-500 mb-10">No per-ticket fees. No surprises. Cancel any time.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Free", price: 0, bots: 1, convs: "50/mo", features: ["1 bot", "Basic chatbot", "URL & PDF ingestion"] },
              { name: "Starter", price: 29, bots: 1, convs: "500/mo", features: ["1 bot", "Shopify integration", "Order lookup"] },
              { name: "Growth", price: 49, bots: 3, convs: "Unlimited", features: ["3 bots", "WooCommerce", "Analytics", "Unlimited conversations"] },
              { name: "Pro", price: 99, bots: 10, convs: "Unlimited", features: ["10 bots", "White-label", "API access", "Priority support"] },
            ].map((p) => (
              <div key={p.name} className={`bg-white rounded-xl border p-5 ${p.name === "Starter" ? "border-indigo-400 ring-1 ring-indigo-400" : ""}`}>
                {p.name === "Starter" && <div className="text-xs font-semibold text-indigo-600 mb-2">MOST POPULAR</div>}
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
                    p.name === "Starter"
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
          <span>© 2026 Helply. All rights reserved.</span>
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        </div>
      </footer>
    </main>
  );
}
