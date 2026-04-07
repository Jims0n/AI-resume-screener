import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Shortlyst AI recruitment software.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-shortlyst-bg text-shortlyst-text font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-shortlyst-border bg-shortlyst-bg/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl tracking-tight text-shortlyst-text">
              shortlyst.
            </span>
          </Link>
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

      {/* Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-shortlyst-text/50 hover:text-shortlyst-text mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="font-serif text-5xl mb-8">Terms of Service</h1>
          <p className="text-shortlyst-text/50 mb-12">Last updated: April 1, 2026</p>

          <div className="space-y-8 text-shortlyst-text/70 leading-relaxed">
            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Shortlyst, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">2. Description of Service</h2>
              <p>
                Shortlyst provides AI-powered resume screening and candidate evaluation software.
                We reserve the right to modify, suspend, or discontinue any aspect of the service
                at any time.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">3. User Accounts</h2>
              <p className="mb-4">You are responsible for:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">4. Acceptable Use</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Use the service for any unlawful purpose</li>
                <li>Upload malicious content or malware</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">5. Data and Privacy</h2>
              <p>
                Your use of Shortlyst is also governed by our{' '}
                <Link href="/privacy" className="text-shortlyst-accent hover:underline">
                  Privacy Policy
                </Link>
                . You retain ownership of all data you upload to our platform.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">6. Intellectual Property</h2>
              <p>
                Shortlyst and its original content, features, and functionality are owned by
                Shortlyst and are protected by international copyright, trademark, and other
                intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">7. Limitation of Liability</h2>
              <p>
                Shortlyst shall not be liable for any indirect, incidental, special, consequential,
                or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">8. Contact</h2>
              <p>
                For questions about these Terms, contact us at{' '}
                <a href="mailto:legal@shortlyst.com" className="text-shortlyst-accent hover:underline">
                  legal@shortlyst.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-shortlyst-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div>
            <span className="font-serif text-4xl mb-8 block">shortlyst.</span>
            <div className="flex gap-8 text-xs uppercase tracking-widest text-shortlyst-text/40 font-medium">
              <Link href="/privacy" className="hover:text-shortlyst-text transition-colors">Privacy</Link>
              <Link href="/terms" className="text-shortlyst-text">Terms</Link>
              <Link href="/blog" className="hover:text-shortlyst-text transition-colors">Blog</Link>
            </div>
          </div>
          <div className="text-xs text-shortlyst-text/30 font-light">
            © 2026 shortlyst. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
