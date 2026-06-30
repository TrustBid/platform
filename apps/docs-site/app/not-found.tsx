import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-500">Page not found</p>
      <Link
        href="/docs/overview"
        className="mt-8 rounded-lg bg-[#2B5BFF] px-6 py-3 text-sm font-medium text-white hover:bg-[#1a44d6]"
      >
        Go to docs
      </Link>
    </div>
  );
}
