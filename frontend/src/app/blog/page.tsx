import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — AI Recruitment & Resume Screening Insights',
  description:
    'Expert insights on AI recruitment software, resume parsing, and modern hiring strategies. Learn how to streamline your talent acquisition process.',
  openGraph: {
    title: 'Blog — AI Recruitment & Resume Screening Insights | Shortlyst',
    description:
      'Expert insights on AI recruitment software, resume parsing, and modern hiring strategies.',
  },
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: 'what-is-resume-parsing-software',
    title: 'What Is Resume Parsing Software? A Complete Guide for Recruiters',
    excerpt:
      'Learn how resume parsing software works, why it matters for modern recruitment, and how AI is transforming the way companies screen candidates.',
    date: '2026-04-07',
    readTime: '8 min read',
    category: 'Technology',
  },
  {
    slug: 'ai-recruitment-software-guide',
    title: 'AI Recruitment Software: How to Choose the Right Platform in 2026',
    excerpt:
      'A comprehensive guide to evaluating AI recruiting platforms. Discover key features, implementation strategies, and ROI considerations.',
    date: '2026-04-07',
    readTime: '10 min read',
    category: 'Guides',
  },
];

export default function BlogPage() {
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

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-shortlyst-text/60">
            <Link href="/#product" className="hover:text-shortlyst-text transition-colors">
              Product
            </Link>
            <Link href="/#how-it-works" className="hover:text-shortlyst-text transition-colors">
              How it works
            </Link>
            <Link href="/blog" className="text-shortlyst-text">
              Blog
            </Link>
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

      {/* Hero */}
      <header className="pt-32 pb-16 px-6 border-b border-shortlyst-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-5xl md:text-7xl leading-tight tracking-tighter mb-6">
            Insights & Resources
          </h1>
          <p className="text-xl text-shortlyst-text/60 font-light max-w-2xl">
            Expert perspectives on AI recruitment, resume parsing, and the future of hiring.
          </p>
        </div>
      </header>

      {/* Blog Posts Grid */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-1">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group p-8 border border-shortlyst-border -mt-[1px] hover:bg-shortlyst-border/20 transition-colors"
              >
                <div className="flex items-center gap-4 mb-4 text-xs uppercase tracking-widest text-shortlyst-text/40">
                  <span className="px-2 py-1 border border-shortlyst-border rounded">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="font-serif text-2xl md:text-3xl mb-3 group-hover:text-shortlyst-accent transition-colors">
                  {post.title}
                </h2>

                <p className="text-shortlyst-text/50 font-light leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                <span className="inline-flex items-center gap-2 text-sm font-medium text-shortlyst-text/60 group-hover:text-shortlyst-accent group-hover:gap-3 transition-all">
                  Read article
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-shortlyst-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-4xl mb-6">Ready to transform your hiring?</h2>
          <p className="text-shortlyst-text/60 mb-8 text-lg">
            Join thousands of recruiters using AI to find top talent faster.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-shortlyst-accent text-shortlyst-bg px-8 py-4 rounded-full text-lg font-semibold hover:opacity-90 transition-all"
          >
            Get early access
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-shortlyst-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div>
            <span className="font-serif text-4xl mb-8 block">shortlyst.</span>
            <div className="flex gap-8 text-xs uppercase tracking-widest text-shortlyst-text/40 font-medium">
              <Link href="/privacy" className="hover:text-shortlyst-text transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-shortlyst-text transition-colors">
                Terms
              </Link>
              <Link href="/blog" className="hover:text-shortlyst-text transition-colors">
                Blog
              </Link>
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
