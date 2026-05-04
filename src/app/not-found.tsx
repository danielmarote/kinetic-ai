import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-bold text-xl text-indigo-600 mb-8">Helply</div>
        <h1 className="text-7xl font-extrabold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h2>
        <p className="text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="border-2 border-gray-200 px-6 py-3 rounded-xl font-semibold hover:border-gray-300 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
