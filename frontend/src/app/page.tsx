import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Navbar */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-200">
              AI
            </div>
            <span className="font-bold text-lg text-slate-900">ResumeScreener</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 ring-1 ring-indigo-100">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Powered by AI
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Screen Resumes with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              AI-Powered
            </span>{' '}
            Precision
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload resumes, paste your job description, and let our AI extract skills, score candidates, and
            rank them — all in seconds, not hours.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-indigo-600 text-white text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 animate-pulse-glow"
            >
              Start Screening for Free
            </Link>
            <Link
              href="/login"
              className="text-base font-semibold text-slate-700 px-6 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Three simple steps to find your best candidates</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '📄',
                title: 'Upload Resumes',
                desc: 'Drag & drop PDF or DOCX resumes. Upload one or hundreds at once.',
                gradient: 'from-blue-500 to-indigo-500',
              },
              {
                icon: '🤖',
                title: 'AI Analysis',
                desc: 'Our AI extracts skills, experience, and education — then scores every candidate against your requirements.',
                gradient: 'from-indigo-500 to-purple-500',
              },
              {
                icon: '🏆',
                title: 'Ranked Results',
                desc: 'Instantly see candidates ranked by fit. View skill matches, strengths, and red flags at a glance.',
                gradient: 'from-purple-500 to-pink-500',
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className={`relative bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${i === 0 ? 'animate-fade-in' : i === 1 ? 'animate-fade-in-delay' : 'animate-fade-in-delay-2'
                  }`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-5 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center animate-fade-in">
            {[
              { stat: '90%', label: 'Time Saved' },
              { stat: '50+', label: 'Skills Tracked' },
              { stat: '3', label: 'Score Dimensions' },
              { stat: '∞', label: 'Resumes' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-indigo-600 mb-1">{s.stat}</div>
                <div className="text-sm text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <span>© 2026 AI Resume Screener. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-700">Privacy</a>
            <a href="#" className="hover:text-slate-700">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
