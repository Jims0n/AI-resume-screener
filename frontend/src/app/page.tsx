import Link from 'next/link';
import { ArrowRight, FileText, Cpu, BarChart3, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-shortlyst-bg text-shortlyst-text font-sans scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-shortlyst-border bg-shortlyst-bg/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl tracking-tight text-shortlyst-text">shortlyst.</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-shortlyst-text/60">
            <a href="#product" className="hover:text-shortlyst-text transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-shortlyst-text transition-colors">How it works</a>
            <a href="#vision" className="hover:text-shortlyst-text transition-colors">Vision</a>
            <Link href="/blog" className="hover:text-shortlyst-text transition-colors">Blog</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-shortlyst-text/80 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-shortlyst-accent text-shortlyst-bg px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-24 px-6 border-b border-shortlyst-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 inline-block px-3 py-1 border border-shortlyst-border rounded-full text-[10px] uppercase tracking-widest text-shortlyst-text/40">
            Now in Early Access
          </div>
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter mb-8 max-w-4xl">
            Refined talent <br />
            discovery.
          </h1>
          <p className="text-xl md:text-2xl text-shortlyst-text/60 max-w-2xl font-light leading-relaxed mb-12">
            AI-powered resume screening, reimagined for the modern recruiter.
            Spend less time filtering, more time hiring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="group bg-shortlyst-accent text-shortlyst-bg px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center justify-center gap-2 hover:gap-3 transition-all"
            >
              Start screening
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Feature Grid */}
      <section id="product" className="py-24 px-6 border-b border-shortlyst-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
            <div className="p-10 border border-shortlyst-border -m-[0.5px] bg-shortlyst-bg">
              <FileText className="w-8 h-8 mb-8 text-shortlyst-text/40" />
              <h3 className="font-serif text-3xl mb-4">Volume at scale.</h3>
              <p className="text-shortlyst-text/50 font-light leading-relaxed">
                Upload hundreds of resumes in seconds. Our parsing engine extracts every nuance with surgical precision.
              </p>
            </div>

            <div className="p-10 border border-shortlyst-border -m-[0.5px] bg-shortlyst-bg">
              <Cpu className="w-8 h-8 mb-8 text-shortlyst-text/40" />
              <h3 className="font-serif text-3xl mb-4">Neural scoring.</h3>
              <p className="text-shortlyst-text/50 font-light leading-relaxed">
                Move beyond keyword matching. Our AI understands experience, potential, and cultural alignment.
              </p>
            </div>

            <div className="p-10 border border-shortlyst-border -m-[0.5px] bg-shortlyst-bg md:col-span-2 lg:col-span-1">
              <BarChart3 className="w-8 h-8 mb-8 text-shortlyst-text/40" />
              <h3 className="font-serif text-3xl mb-4">Data-led decisions.</h3>
              <p className="text-shortlyst-text/50 font-light leading-relaxed">
                Visualize your talent pool with advanced analytics and comparison tools that reveal the true outliers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="how-it-works" className="py-24 px-6 border-b border-shortlyst-border bg-shortlyst-bg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/3">
              <h2 className="font-serif text-5xl mb-6">The shortlyst methodology.</h2>
              <p className="text-shortlyst-text/60 font-light leading-relaxed">
                We&apos;ve distilled the recruitment process into three core pillars. Minimal effort, maximum output.
              </p>
            </div>

            <div className="lg:w-2/3 space-y-16">
              {[
                { step: '01', title: 'Ingest', desc: 'Sync your job descriptions and candidate resumes. Simple drag-and-drop or API integration.' },
                { step: '02', title: 'Synthesize', desc: 'Our AI analyzes and scores candidates across three dimensions: skills, experience, and education.' },
                { step: '03', title: 'Accelerate', desc: 'Review your ranked shortlist and move your best candidates straight to the interview phase.' },
              ].map((item) => (
                <div key={item.step} className="flex gap-8 group">
                  <span className="font-serif text-xl text-shortlyst-text/30 group-hover:text-shortlyst-text/80 transition-colors pt-1">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="font-serif text-4xl mb-3">{item.title}</h4>
                    <p className="text-shortlyst-text/50 text-xl font-light leading-relaxed max-w-xl">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust/Vision Section */}
      <section id="vision" className="py-32 px-6 border-b border-shortlyst-border">
        <div className="max-w-3xl mx-auto text-center">
          <Globe className="w-12 h-12 mx-auto mb-10 text-shortlyst-text/20" />
          <h2 className="font-serif text-5xl md:text-7xl mb-12 tracking-tight">
            The future of hiring is quiet.
          </h2>
          <p className="text-2xl text-shortlyst-text/60 font-light leading-relaxed italic mb-12">
            &ldquo;We believe the best tech fades into the background, leaving only the clarity you need to make the right choice.&rdquo;
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div>
            <span className="font-serif text-4xl mb-8 block">shortlyst.</span>
            <div className="flex gap-8 text-xs uppercase tracking-widest text-shortlyst-text/40 font-medium">
              <Link href="/privacy" className="hover:text-shortlyst-text transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-shortlyst-text transition-colors">Terms</Link>
              <Link href="/blog" className="hover:text-shortlyst-text transition-colors">Blog</Link>
            </div>
          </div>
          <div className="text-xs text-shortlyst-text/30 font-light">
            © 2026 shortlyst. All rights reserved. <br className="md:hidden" />
            Empowering teams to find the signal in the noise.
          </div>
        </div>
      </footer>
    </div>
  );
}
