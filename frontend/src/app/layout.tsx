import type { Metadata } from 'next';
import Link from 'next/link';
import { OpenStudioButton, StudioScrollWatcher } from '../components/common/OpenStudioButton';
import { SiteLayoutWrapper } from '../components/common/SiteLayoutWrapper';
import '../index.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://ai.cretivra.com'),
  title: {
    default: 'Asura AI by Cretivra | AI Agents & Business Automation',
    template: '%s | Asura AI by Cretivra',
  },
  description:
    'Asura AI by Cretivra builds intelligent agents, automation systems, and custom AI software that help businesses cut manual work and scale. Get started today.',
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
    'Asura AI by Cretivra',
    'Cretivra',
  ],
  authors: [{ name: 'Asura AI by Cretivra' }],
  creator: 'Asura AI by Cretivra',
  publisher: 'Asura AI by Cretivra',
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
    siteName: 'Asura AI by Cretivra',
    title: 'Asura AI by Cretivra | AI Agents & Business Automation',
    description:
      'Asura AI by Cretivra builds intelligent agents, automation systems, and custom AI software that help businesses cut manual work and scale.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Asura AI by Cretivra — Think Beyond',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asura AI by Cretivra | AI Agents & Business Automation',
    description:
      'Asura AI by Cretivra builds intelligent agents, automation systems, and custom AI software that help businesses cut manual work and scale.',
    images: ['/logo.png'],
    creator: '@cretivra',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Asura AI by Cretivra',
  url: 'https://ai.cretivra.com',
  logo: 'https://ai.cretivra.com/logo.png',
  description:
    'Asura AI by Cretivra turns AI into practical products, intelligent agents, and business automation.',
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
    <html lang="en" className="light scroll-smooth" data-theme="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('cretivra_theme');
                  var theme = (saved === 'dark' || saved === 'light' || saved === 'system') ? saved : 'light';
                  var resolved = theme;
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  var root = document.documentElement;
                  root.setAttribute('data-theme', resolved);
                  root.classList.remove('dark', 'light');
                  root.classList.add(resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-base)] text-[var(--text)] font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-700 dark:selection:text-cyan-200">
        {/* Global Ambient Background Orbs */}
        <div className="cv-ambient" aria-hidden="true">
          <div className="cv-orb cv-orb-1" />
          <div className="cv-orb cv-orb-2" />
        </div>
        <StudioScrollWatcher />

        <SiteLayoutWrapper
          header={
            <header className="sticky top-0 z-50 w-full border-b border-[#232d45]/70 bg-[#060911]/85 backdrop-blur-md">
              <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
                >
                  <img
                    src="/logo.png"
                    alt="Asura AI by Cretivra Logo"
                    className="w-7 h-7 object-contain rounded-md shadow-sm"
                  />
                  <span className="text-base font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-300">
                    ASURA<span className="text-cyan-400 ml-1 font-black">AI</span>
                    <span className="text-xs text-slate-400 font-normal ml-1.5 hidden sm:inline">by Cretivra</span>
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
                  <Link
                    href="/test-bench"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                  >
                    <span>Test Bench</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">Arena</span>
                  </Link>
                </nav>

                <div className="flex items-center gap-3">
                  <OpenStudioButton className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all">
                    Open Studio
                  </OpenStudioButton>
                </div>
              </div>
            </header>
          }
          footer={
            <footer className="relative z-10 border-t border-[#232d45] bg-[#0d121f]/90 py-12 px-4 sm:px-6">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Asura AI by Cretivra" className="w-6 h-6" />
                    <span className="font-extrabold text-sm tracking-wider text-white">
                      ASURA AI <span className="text-xs text-cyan-400 font-normal">by Cretivra</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Asura AI by Cretivra turns AI into practical products, intelligent agents,
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
                    <li>
                      <a
                        href="/studio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-cyan-400/90"
                      >
                        <span>Asura AI Studio</span>
                        <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20">Live</span>
                      </a>
                    </li>
                    <li>
                      <Link
                        href="/test-bench"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-gray-300"
                      >
                        <span>Model Test Bench & Arena</span>
                        <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">Benchmark</span>
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
                  &copy; {new Date().getFullYear()} Asura AI by Cretivra. All rights
                  reserved.
                </span>
                <span className="mt-2 sm:mt-0">
                  Your AI. Your data. Your control.
                </span>
              </div>
            </footer>
          }
        >
          {children}
        </SiteLayoutWrapper>
      </body>
    </html>
  );
}
