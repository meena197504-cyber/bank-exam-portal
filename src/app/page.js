import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-900 text-white p-2 rounded-lg font-extrabold text-xl">
              🏦
            </div>
            <div>
              <span className="text-xl font-bold text-blue-950 block leading-none">
                Bank Exam Portal
              </span>
              <span className="text-xs text-slate-500 font-medium">
                JAIIB & CAIIB Preparation
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-blue-900 transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 transition-all px-4 py-2 rounded-md shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-800 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          2026 Updated Mock Exam Engine
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl">
          Master Your <span className="text-blue-900">JAIIB & CAIIB</span> Banking Exams with Confidence
        </h1>

        <p className="mt-4 text-lg text-slate-600 max-w-2xl leading-relaxed">
          Real-time exam simulator, full-length timed tests, instant performance analytics, and detailed question explanations engineered specifically for banking professionals.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-900 text-white font-semibold rounded-lg shadow-md hover:bg-blue-800 transition-all text-base"
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 transition-all text-base"
          >
            Candidate Sign In
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center font-bold text-lg mb-4">
              ⏱️
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Timed Exam Simulator</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Experience authentic test pressure with countdown timers, question palettes, and auto-submission routines.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-green-100 text-green-800 rounded-lg flex items-center justify-center font-bold text-lg mb-4">
              📊
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Instant Score Evaluation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get immediate mark breakdowns, accuracy percentages, and comprehensive question-by-question explanations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-lg flex items-center justify-center font-bold text-lg mb-4">
              🔒
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Secure Portal Access</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlock module tests, track performance history over time, and manage candidate account credentials securely.
            </p>
          </div>
        </div>
      </main>

      {/* Portal Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <span>© 2026 Bank Exam Portal. All rights reserved.</span>
          <div className="flex space-x-4">
            <Link href="/login" className="hover:underline">Sign In</Link>
            <Link href="/admin" className="hover:underline text-slate-400">Admin Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
