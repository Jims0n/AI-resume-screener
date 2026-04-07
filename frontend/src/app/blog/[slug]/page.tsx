import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react';
import { notFound } from 'next/navigation';

interface BlogPostData {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}

const blogPosts: Record<string, BlogPostData> = {
  'what-is-resume-parsing-software': {
    slug: 'what-is-resume-parsing-software',
    title: 'What Is Resume Parsing Software? A Complete Guide for Recruiters',
    excerpt:
      'Learn how resume parsing software works, why it matters for modern recruitment, and how AI is transforming the way companies screen candidates.',
    date: '2026-04-07',
    readTime: '8 min read',
    category: 'Technology',
    metaTitle: 'What Is Resume Parsing Software? Complete Guide (2026)',
    metaDescription:
      'Discover how resume parsing software automates candidate screening. Learn about AI-powered parsing, key features, and how to choose the right solution for your team.',
    content: `
## What Is Resume Parsing?

Resume parsing software is a technology that automatically extracts, analyzes, and organizes information from resumes and CVs. Instead of manually reading through hundreds of applications, recruiters can use parsing software to instantly convert unstructured resume data into structured, searchable information.

Modern resume parsing software uses a combination of natural language processing (NLP), machine learning, and artificial intelligence to understand the context and meaning behind resume content—not just keywords.

## How Does Resume Parsing Software Work?

The parsing process typically involves several stages:

### 1. Document Ingestion
The software accepts resumes in various formats including PDF, DOCX, TXT, and even images. Advanced parsers can handle scanned documents using optical character recognition (OCR).

### 2. Text Extraction
Raw text is extracted from the document while preserving the logical structure. This includes handling multi-column layouts, tables, and various formatting styles.

### 3. Entity Recognition
The AI identifies and categorizes key information:
- **Contact details** — Name, email, phone, location
- **Work experience** — Companies, titles, dates, responsibilities
- **Education** — Degrees, institutions, graduation dates
- **Skills** — Technical skills, soft skills, certifications
- **Languages** — Proficiency levels

### 4. Normalization & Enrichment
Data is standardized for consistency. For example, "Sr. Software Engineer" and "Senior Software Developer" might be normalized to the same category. Some parsers also enrich data by inferring skills from job titles or adding company information.

## Why Resume Parsing Matters for Modern Recruitment

### The Volume Problem
The average corporate job posting receives 250 applications. For high-volume roles, this number can reach thousands. Manual screening is simply not scalable.

### Time Savings
Resume parsing software can reduce initial screening time by up to 75%. What once took hours now takes minutes.

### Improved Candidate Experience
Faster processing means faster responses to candidates. In a competitive talent market, speed matters.

### Better Data Quality
Structured data enables better analytics, reporting, and decision-making. You can finally answer questions like "What percentage of our engineering candidates have Python experience?"

## Key Features to Look For

When evaluating resume parsing software, consider these capabilities:

1. **Accuracy** — Look for parsers with 95%+ accuracy rates on standard resume formats
2. **Format Support** — Ensure compatibility with PDF, DOCX, and other common formats
3. **Language Support** — Important for global hiring
4. **Integration** — API access and ATS integrations
5. **Customization** — Ability to define custom fields and extraction rules
6. **Compliance** — GDPR and data privacy features

## The Future: AI-Powered Parsing

Traditional keyword-based parsing is giving way to AI-powered solutions that understand context. These systems can:

- Infer skills from job descriptions even when not explicitly stated
- Understand career progression and potential
- Score candidates based on job fit, not just keyword matches
- Reduce bias by focusing on qualifications over demographics

## Getting Started with Resume Parsing

If you're ready to implement resume parsing software, start by:

1. Auditing your current screening process and identifying bottlenecks
2. Defining your must-have features and integration requirements
3. Testing multiple solutions with your actual resume data
4. Measuring accuracy and time savings during your trial period

---

*Ready to experience AI-powered resume parsing? [Try Shortlyst free](/register) and see how our neural scoring engine can transform your hiring process.*
    `,
  },
  'ai-recruitment-software-guide': {
    slug: 'ai-recruitment-software-guide',
    title: 'AI Recruitment Software: How to Choose the Right Platform in 2026',
    excerpt:
      'A comprehensive guide to evaluating AI recruiting platforms. Discover key features, implementation strategies, and ROI considerations.',
    date: '2026-04-07',
    readTime: '10 min read',
    category: 'Guides',
    metaTitle: 'AI Recruitment Software: Complete Buying Guide (2026)',
    metaDescription:
      'Learn how to evaluate and choose AI recruitment software. Compare features, understand ROI, and discover what makes AI recruiting platforms effective.',
    content: `
## The Rise of AI in Recruitment

Artificial intelligence is fundamentally changing how companies find and hire talent. From resume screening to candidate engagement, AI recruitment software is automating repetitive tasks while providing insights that were previously impossible to obtain at scale.

But with dozens of AI recruiting platforms on the market, how do you choose the right one for your organization?

## What Is AI Recruitment Software?

AI recruitment software uses machine learning, natural language processing, and predictive analytics to automate and enhance various stages of the hiring process:

- **Sourcing** — Finding passive candidates across platforms
- **Screening** — Evaluating resumes and applications
- **Matching** — Connecting candidates to suitable roles
- **Engagement** — Automating communication and scheduling
- **Assessment** — Evaluating skills and cultural fit
- **Analytics** — Providing insights on hiring performance

## Key Features to Evaluate

### 1. Resume Parsing & Screening

The foundation of any AI recruiting platform is its ability to process and understand resumes. Look for:

- **High accuracy** — 95%+ extraction accuracy
- **Contextual understanding** — Beyond keyword matching
- **Bias reduction** — Features that promote fair evaluation
- **Multi-format support** — PDF, DOCX, images, LinkedIn profiles

### 2. Candidate Scoring & Ranking

Effective AI recruitment software should provide intelligent scoring based on:

- Skills match to job requirements
- Experience relevance and progression
- Education and certification alignment
- Cultural fit indicators (when appropriate)

### 3. Integration Capabilities

Your AI recruiting platform should work seamlessly with:

- Applicant Tracking Systems (ATS)
- HR Information Systems (HRIS)
- Job boards and sourcing platforms
- Calendar and email systems
- Background check providers

### 4. Analytics & Reporting

Data-driven recruitment requires robust analytics:

- Pipeline visibility and bottleneck identification
- Time-to-hire and cost-per-hire metrics
- Source effectiveness analysis
- Diversity and inclusion reporting
- Predictive hiring insights

### 5. Compliance & Security

Non-negotiable requirements include:

- GDPR and CCPA compliance
- SOC 2 certification
- Data encryption and access controls
- Audit trails and documentation
- Candidate consent management

## Evaluating AI Accuracy

Not all AI is created equal. When evaluating platforms, ask:

### What training data was used?
AI models are only as good as their training data. Look for platforms trained on diverse, representative datasets.

### How is bias addressed?
Ask vendors specifically how they identify and mitigate algorithmic bias. Request documentation of their fairness testing.

### What's the false positive/negative rate?
Understand how often the AI incorrectly accepts or rejects candidates. Both metrics matter.

### Can the AI explain its decisions?
"Black box" AI is increasingly problematic. Look for explainable AI that can articulate why a candidate was scored a certain way.

## Implementation Best Practices

### Start with a Pilot
Don't roll out AI recruitment software across your entire organization immediately. Start with one team or job family to learn and iterate.

### Define Success Metrics
Before implementation, establish clear KPIs:
- Reduction in time-to-screen
- Improvement in quality-of-hire
- Recruiter productivity gains
- Candidate experience scores

### Train Your Team
AI augments recruiters—it doesn't replace them. Invest in training so your team understands how to work effectively with AI recommendations.

### Monitor and Adjust
AI systems require ongoing monitoring. Regularly review outcomes and adjust configurations as needed.

## ROI Considerations

When building your business case, consider:

### Direct Cost Savings
- Reduced time spent on manual screening
- Lower cost-per-hire
- Decreased reliance on external recruiters

### Indirect Benefits
- Improved quality-of-hire
- Better candidate experience
- Enhanced employer brand
- Data-driven decision making

### Typical ROI Timeline
Most organizations see positive ROI within 6-12 months of implementation, with full benefits realized by 18-24 months.

## Red Flags to Watch For

Be cautious of vendors who:

- Can't explain how their AI works
- Don't address bias and fairness
- Lack enterprise security certifications
- Have no integration capabilities
- Promise unrealistic results

## Making Your Decision

The right AI recruitment software depends on your specific needs:

| If you need... | Prioritize... |
|----------------|---------------|
| High-volume screening | Parsing accuracy and speed |
| Quality over quantity | Sophisticated matching algorithms |
| Global hiring | Multi-language support |
| Enterprise scale | Security and integrations |
| Quick implementation | Ease of use and support |

## Conclusion

AI recruitment software represents a significant opportunity to improve hiring efficiency and outcomes. By carefully evaluating features, accuracy, and vendor credibility, you can select a platform that delivers real value for your organization.

---

*Looking for AI recruitment software that combines powerful parsing with intuitive design? [Explore Shortlyst](/register) and see how our platform can transform your hiring process.*
    `,
  },
};

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = blogPosts[params.slug];

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: 'article',
      publishedTime: post.date,
      authors: ['Shortlyst'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }));
}

function parseMarkdown(content: string): string {
  return content
    .replace(/^## (.*$)/gim, '<h2 class="font-serif text-3xl mt-12 mb-6">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="font-serif text-2xl mt-8 mb-4">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="my-4 list-disc">$&</ul>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2">$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-shortlyst-accent hover:underline">$1</a>')
    .replace(/^---$/gim, '<hr class="my-12 border-shortlyst-border" />')
    .replace(/\n\n/g, '</p><p class="mb-6 text-shortlyst-text/70 leading-relaxed">')
    .replace(/^\|(.+)\|$/gim, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      const isHeader = cells.some(c => c.includes('---'));
      if (isHeader) return '';
      return `<tr>${cells.map(c => `<td class="border border-shortlyst-border px-4 py-2">${c}</td>`).join('')}</tr>`;
    });
}

export default function BlogPostPage({ params }: Props) {
  const post = blogPosts[params.slug];

  if (!post) {
    notFound();
  }

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
            <Link href="/blog" className="hover:text-shortlyst-text transition-colors">
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

      {/* Article Header */}
      <header className="pt-32 pb-12 px-6 border-b border-shortlyst-border">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-shortlyst-text/50 hover:text-shortlyst-text mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="flex items-center gap-4 mb-6 text-xs uppercase tracking-widest text-shortlyst-text/40">
            <span className="px-2 py-1 border border-shortlyst-border rounded">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-6">
            {post.title}
          </h1>

          <p className="text-xl text-shortlyst-text/60 font-light leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      </header>

      {/* Article Content */}
      <article className="py-12 px-6">
        <div
          className="max-w-3xl mx-auto prose-shortlyst"
          dangerouslySetInnerHTML={{
            __html: `<p class="mb-6 text-shortlyst-text/70 leading-relaxed">${parseMarkdown(post.content)}</p>`,
          }}
        />
      </article>

      {/* Share & CTA */}
      <section className="py-16 px-6 border-t border-shortlyst-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <span className="text-sm text-shortlyst-text/50">Share this article</span>
            <div className="flex gap-4">
              <button className="p-2 border border-shortlyst-border rounded hover:bg-shortlyst-border/20 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-8 border border-shortlyst-border text-center">
            <h3 className="font-serif text-2xl mb-4">Ready to transform your hiring?</h3>
            <p className="text-shortlyst-text/60 mb-6">
              Experience AI-powered resume screening that actually works.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-shortlyst-accent text-shortlyst-bg px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all"
            >
              Get early access
            </Link>
          </div>
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
