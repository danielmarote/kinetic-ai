export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "Arial, sans-serif", lineHeight: 1.7, color: "#333" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 32 }}>Last updated: May 1, 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Information We Collect</h2>
        <p>When you install Helply and connect it to your Shopify store, we collect:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Your Shopify store domain and OAuth access token (to query orders and products)</li>
          <li>Documents you upload (PDFs, URLs, text) to power your knowledge base</li>
          <li>Chat conversations between your customers and your bots (message content only)</li>
          <li>Your account email via Clerk authentication</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. How We Use Your Data</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>To power the AI chatbot responses on your storefront</li>
          <li>To look up order status via the Shopify Admin API</li>
          <li>To provide analytics and conversation history in your dashboard</li>
          <li>To process billing via Stripe</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. Data Sharing</h2>
        <p>We do not sell your data. We share data only with:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>Anthropic</strong> — to generate AI responses (chat messages are sent to Claude API)</li>
          <li><strong>Stripe</strong> — for payment processing</li>
          <li><strong>Resend</strong> — for transactional emails (escalation notifications)</li>
          <li><strong>Neon</strong> — for database hosting</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Customer Data (Shopify)</h2>
        <p>
          We access customer order data via the Shopify Admin API only when a customer queries their order status through the chat widget. We do not store personally identifiable customer information beyond the chat conversation content.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Data Deletion</h2>
        <p>
          When you uninstall Helply from your Shopify store, we will delete all data associated with your store within 30 days, in compliance with Shopify&apos;s GDPR requirements. To request immediate deletion, contact us at privacy@helply.ai.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Security</h2>
        <p>
          All data is stored in encrypted PostgreSQL databases. API tokens are stored securely and never exposed publicly. All traffic uses HTTPS/TLS.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>7. Contact</h2>
        <p>For privacy questions or data requests, contact: <a href="mailto:privacy@helply.ai">privacy@helply.ai</a></p>
      </section>
    </div>
  );
}
