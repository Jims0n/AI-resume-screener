import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://getshortlyst.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Shortlyst — AI Resume Screening & Recruitment Software',
    template: '%s | Shortlyst',
  },
  description:
    'AI-powered resume screening software that helps recruiters find top talent faster. Parse hundreds of resumes in seconds with neural scoring and data-led insights.',
  keywords: [
    'AI recruitment software',
    'resume parsing software',
    'AI recruiting platforms',
    'resume screening',
    'talent acquisition',
    'hiring automation',
    'candidate scoring',
    'HR technology',
  ],
  authors: [{ name: 'Shortlyst' }],
  creator: 'Shortlyst',
  publisher: 'Shortlyst',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Shortlyst',
    title: 'Shortlyst — AI Resume Screening & Recruitment Software',
    description:
      'AI-powered resume screening software that helps recruiters find top talent faster. Parse hundreds of resumes in seconds.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Shortlyst — Refined talent discovery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shortlyst — AI Resume Screening & Recruitment Software',
    description:
      'AI-powered resume screening software that helps recruiters find top talent faster.',
    images: ['/og-image.png'],
    creator: '@shortlyst',
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    google: '_wfTVo8EZXtPIiIrANBGPf8-I4RKbb6i32NloHhW3Go',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Shortlyst',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered resume screening software that helps recruiters find top talent faster.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Shortlyst',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  sameAs: ['https://twitter.com/shortlyst', 'https://linkedin.com/company/shortlyst'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'support@shortlyst.com',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} font-sans transition-colors duration-200`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
