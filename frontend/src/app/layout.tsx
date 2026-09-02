import type { Metadata } from 'next';
import Link from 'next/link';
import '../index.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://ai.cretivra.com'),
  title: {
    default: 'Cretivra AI | AI Agents & Business Automation',
    template: '%s | Cretivra AI',
  },
  description:
    'Cretivra AI builds intelligent agents, automation systems, and custom AI software that help businesses cut manual work and scale. Get started today.',
  keywords: [
    'AI automation company',
    'AI agents for business',
    'custom AI software development',
    'generative AI solutions for business',
    'AI business automation company',
    'AI implementation services',
    'AI-powered business tools',
    'AI agent development company',
    'business process automation with AI',
    'enterprise AI solutions provider',
    'Cretivra AI',
  ],
  authors: [{ name: 'Cretivra AI' }],
  creator: 'Cretivra AI',
  publisher: 'Cretivra AI',
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
    url: 'https://ai.cretivra.com',
    siteName: 'Cretivra AI',
    title: 'Cretivra AI | AI Agents & Business Automation',
    description:
      'Cretivra AI builds intelligent agents, automation systems, and custom AI software that help businesses cut manual work and scale.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Cretivra AI — Think Beyond',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cretivra AI | AI Agents & Business Automation',
    description:
      'Cretivra AI builds intelligent agents, automation systems, and custom AI software that help businesses cut manual work and scale.',
    images: ['/logo.png'],
    creator: '@cretivra',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png' }],
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cretivra AI',
  url: 'https://ai.cretivra.com',
  logo: 'https://ai.cretivra.com/logo.png',
  description:
    'Cretivra AI turns AI into practical products, intelligent agents, and business automation.',
  sameAs: [
    'https://linkedin.com/company/cretivra',
    'https://twitter.com/cretivra',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: 'https://ai.cretivra.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-screen bg-[#060911] text-[#e7eaf4] font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Global Ambient Background Orbs */}
        <div className="cv-ambient" aria-hidden="true">
          <div className="cv-orb cv-orb-1" />
          <div className="cv-orb cv-orb-2" />
        </div>

        {/* Global SEO / Brand Header Bar */}
        <header className="sticky top-0 z-50 w-full border-b border-[#232d45]/70 bg-[#060911]/85 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="Cretivra AI Logo"
                className="w-7 h-7 object-contain rounded-md shadow-sm"
              />
              <span className="text-base font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-300">
                CRETIVRA<span className="text-cyan-400 ml-1 font-black">AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-300">
              <Link
                href="/ai-agents"
                className="hover:text-cyan-400 transition-colors"
              >
                AI Agents
              </Link>
              <Link
                href="/automation"
                className="hover:text-cyan-400 transition-colors"
              >
                Automation
              </Link>
              <Link
                href="/generative-ai"
                className="hover:text-cyan-400 transition-colors"
              >
                Generative AI
              </Link>
              <Link
                href="/blog"
                className="hover:text-cyan-400 transition-colors"
              >
                Insights & Blog
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="#chat-workspace"
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
              >
                Open Studio
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="relative z-10">{children}</main>

        {/* Global Footer with Internal Linking */}
        <footer className="relative z-10 border-t border-[#232d45] bg-[#0d121f]/90 py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Cretivra AI" className="w-6 h-6" />
                <span className="font-extrabold text-sm tracking-wider text-white">
                  CRETIVRA AI
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Cretivra AI turns AI into practical products, intelligent agents,
                and business automation. Think Beyond.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                Core Services
              </h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link
                    href="/ai-agents"
                    className="hover:text-cyan-400 transition-colors"
                  >
                    AI Agents for Business
                  </Link>
                </li>
                <li>
                  <Link
                    href="/automation"
                    className="hover:text-cyan-400 transition-colors"
                  >
                    Business Process Automation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/generative-ai"
                    className="hover:text-cyan-400 transition-colors"
                  >
                    Generative AI Solutions
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                Resources & Guides
              </h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-cyan-400 transition-colors"
                  >
                    Knowledge Hub & Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog#what-is-an-ai-agent"
                    className="hover:text-cyan-400 transition-colors"
                  >
                    What Is an AI Agent?
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog#ai-agents-vs-chatbots"
                    className="hover:text-cyan-400 transition-colors"
                  >
                    AI Agents vs. Chatbots
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                Connect & Deploy
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                Enterprise custom AI software tailored to how your business
                actually operates.
              </p>
              <div className="flex items-center gap-3 text-xs text-cyan-400">
                <a
                  href="https://linkedin.com/company/cretivra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  LinkedIn
                </a>
                <span>•</span>
                <a
                  href="https://twitter.com/cretivra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Twitter / X
                </a>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#232d45]/60 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500">
            <span>
              &copy; {new Date().getFullYear()} Cretivra AI. All rights
              reserved.
            </span>
            <span className="mt-2 sm:mt-0">
              Your AI. Your data. Your control.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
