import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-2xl bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-4">
          JAIIB & CAIIB Mock Exam Portal
        </h1>
        <p className="text-gray-600 mb-8 text-base">
          Practice authentic bank exam mock tests with real-time countdown timer, question palette, and detailed performance analytics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700 transition"
          >
            Candidate Login
          </Link>
          <Link
            href="/signup"
            className="bg-gray-100 text-blue-900 border border-gray-300 font-semibold px-6 py-3 rounded-md hover:bg-gray-200 transition"
          >
            New Candidate Signup
          </Link>
          <Link
            href="/admin"
            className="bg-gray-800 text-white font-semibold px-6 py-3 rounded-md hover:bg-gray-900 transition"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
