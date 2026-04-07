import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Shortlyst collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
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

          <h1 className="font-serif text-5xl mb-8">Privacy Policy</h1>
          <p className="text-shortlyst-text/50 mb-12">Last updated: April 1, 2026</p>

          <div className="space-y-8 text-shortlyst-text/70 leading-relaxed">
            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                We collect information you provide directly to us, including when you create an account,
                upload resumes, or contact us for support. This may include:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Name and email address</li>
                <li>Company information</li>
                <li>Resume and candidate data you upload</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services,
                process transactions, send you technical notices and support messages, and respond
                to your comments and questions.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">3. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal
                data against unauthorized access, alteration, disclosure, or destruction. All data is
                encrypted in transit and at rest.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">4. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide
                you services. You can request deletion of your data at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">5. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-shortlyst-text mb-4">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@shortlyst.com" className="text-shortlyst-accent hover:underline">
                  privacy@shortlyst.com
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
              <Link href="/privacy" className="text-shortlyst-text">Privacy</Link>
              <Link href="/terms" className="hover:text-shortlyst-text transition-colors">Terms</Link>
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
