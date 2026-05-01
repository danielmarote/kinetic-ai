import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          AI SaaS Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Coming soon. The smartest AI tool for your workflow.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Get Early Access
          </Link>
          <Link
            href="/sign-in"
            className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
