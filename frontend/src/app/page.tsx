import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bot,
  Zap,
  Cpu,
  Workflow,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import App from '../App';

export const metadata: Metadata = {
  title: 'Cretivra AI | AI Agents & Business Automation',
  description:
    'Cretivra AI builds intelligent agents, automation systems, and custom AI software that help businesses cut manual work and scale. Get started today.',
  alternates: {
    canonical: 'https://ai.cretivra.com',
  },
};

const FAQ_ITEMS = [
  {
    q: 'What is an AI agent?',
    a: 'An AI agent is a system that can independently complete tasks or workflows — like handling support tickets or processing data — without needing step-by-step human instructions for each action.',
  },
  {
    q: 'How is Cretivra AI different from a chatbot company?',
    a: 'Cretivra AI builds systems that take action, not just answer questions — agents that execute workflows, automation that runs processes, and software built around your specific operations.',
  },
  {
    q: 'What industries does Cretivra AI work with?',
    a: 'Cretivra AI works with businesses across recruitment, customer support, productivity, and analytics, building AI solutions tailored to each company\'s workflows.',
  },
  {
    q: 'How long does it take to implement an AI automation solution?',
    a: 'Timelines vary by scope, but most engagements move from strategy to a working pilot within a few weeks, followed by iteration based on real usage.',
  },
  {
    q: 'Do I need technical expertise to use Cretivra AI\'s solutions?',
    a: 'No — Cretivra AI handles the strategy, development, and implementation, so your team can use the resulting tools without needing in-house AI expertise.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* SEO Hero Section (Server Rendered HTML for Crawlers and Humans) */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#232d45]/60 bg-gradient-to-b from-[#060911] via-[#0d121f]/50 to-[#060911]">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Think Beyond — Practical AI for Real Business Problems
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            AI Agents &amp; Automation{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              That Actually Run Your Business
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Cretivra AI helps businesses move past AI experimentation and into
            real, working systems. We design and build generative AI
            applications, autonomous AI agents, and automation workflows that
            remove manual, repetitive work from day-to-day operations — freeing
            teams to focus on higher-value work. Whether you need an AI agent
            that manages customer support tickets end-to-end, a custom AI tool
            built around your internal processes, or a full automation layer
            connecting your existing software, Cretivra AI handles the
            strategy, development, and implementation. We work across
            recruitment, customer support, productivity, and analytics use
            cases, building solutions that fit how your business actually
            operates rather than forcing a generic template. The result: less
            manual overhead, faster execution, and AI that&apos;s actually in
            production — not stuck in a pilot. That&apos;s what &ldquo;Think
            Beyond&rdquo; means at Cretivra AI.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#chat-workspace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
            >
              Launch Interactive AI Studio
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/ai-agents"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#151c2e] hover:bg-[#1a233a] border border-[#232d45] text-gray-200 font-semibold text-sm transition-all"
            >
              Explore AI Agents
            </Link>
          </div>

          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-[#232d45]/40 mt-8">
            <div className="p-3 rounded-xl bg-[#0d121f]/60 border border-[#232d45]/50">
              <span className="text-xs text-gray-400 block">Focus</span>
              <span className="text-sm font-bold text-white">Production AI</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0d121f]/60 border border-[#232d45]/50">
              <span className="text-xs text-gray-400 block">Security</span>
              <span className="text-sm font-bold text-cyan-400">Zero Data Leakage</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0d121f]/60 border border-[#232d45]/50">
              <span className="text-xs text-gray-400 block">Deployment</span>
              <span className="text-sm font-bold text-white">Cloud or On-Prem</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0d121f]/60 border border-[#232d45]/50">
              <span className="text-xs text-gray-400 block">Speed to Value</span>
              <span className="text-sm font-bold text-purple-400">Weeks, Not Years</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capability H2 Sections */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Generative AI Applications Built for Your Business
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            We build specialized intelligence layers that plug into your databases,
            documents, and team communication channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] hover:border-cyan-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              AI Agents That Handle Tasks and Workflows Autonomously
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Move beyond basic prompt-and-response. Deploy agents that reason, plan,
              execute API calls, and resolve complex workflows autonomously.
            </p>
            <Link
              href="/ai-agents"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 mt-4 hover:underline"
            >
              Learn more &rarr;
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] hover:border-blue-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Workflow className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Automate Repetitive Processes, Not Your Team&apos;s Time
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Connect legacy systems, CRMs, ERPs, and ticketing platforms with
              resilient AI pipelines that eliminate hundreds of hours of manual entry.
            </p>
            <Link
              href="/automation"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 mt-4 hover:underline"
            >
              Explore automation &rarr;
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] hover:border-purple-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Custom AI Software Tailored to How You Actually Work
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Tailor-fit neural architectures, fine-tuned models, and document
              reasoning engines engineered precisely to match your domain terminology.
            </p>
            <Link
              href="/generative-ai"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 mt-4 hover:underline"
            >
              View generative solutions &rarr;
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] hover:border-emerald-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              From Strategy to Implementation — We Get AI Into Production
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We guide you from feasibility roadmaps and architecture audits to
              enterprise production deployment, monitoring, and iterative fine-tuning.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-4 hover:underline"
            >
              Read guides &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive AI Chat & Image Studio Workspace */}
      <section
        id="chat-workspace"
        className="relative border-t border-b border-[#232d45] bg-[#060911]"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#232d45]/60 mb-2">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                Interactive Platform
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Cretivra AI Intelligence Studio
              </h2>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Direct access to frontier models, web search grounding &amp; image creation
            </div>
          </div>
        </div>

        {/* Embedded Interactive Client App */}
        <div className="min-h-[720px] h-[85vh] w-full relative">
          <App />
        </div>
      </section>

      {/* FAQ Section with FAQPage Schema Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Everything You Need to Know About Cretivra AI
          </h2>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <details
              key={idx}
              className="group p-5 rounded-xl bg-[#0d121f] border border-[#232d45] hover:border-[#3b82f6]/40 transition-all [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer font-bold text-sm text-white select-none">
                <span>{item.q}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-3" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed pt-2 border-t border-[#232d45]/60">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="py-12 px-4 border-t border-[#232d45]/60 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Ready to Automate Workflows and Scale With AI?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
            Partner with Cretivra AI to design, build, and deploy custom AI agents
            and automation systems engineered for your business operations.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <a
              href="#chat-workspace"
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#060911] font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              Try Cretivra Studio
            </a>
            <Link
              href="/ai-agents"
              className="px-5 py-2.5 rounded-lg bg-[#151c2e] hover:bg-[#1a233a] border border-[#232d45] text-white font-semibold text-xs transition-all"
            >
              Explore AI Agent Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
