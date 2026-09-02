import type { Metadata } from 'next';
import Link from 'next/link';
import { Cpu, Sparkles, Terminal, Database, Lock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Custom AI Software Development & Generative AI Solutions',
  description:
    'Tailor-fit generative AI applications, enterprise RAG search engines, and custom AI software built by Cretivra AI for your specific business workflows.',
  alternates: {
    canonical: 'https://ai.cretivra.com/generative-ai',
  },
  keywords: [
    'custom AI software development',
    'generative AI solutions for business',
    'enterprise AI solutions provider',
    'AI-powered business tools',
    'custom LLM applications',
  ],
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Custom Generative AI Software Development',
  provider: {
    '@type': 'Organization',
    name: 'Cretivra AI',
    url: 'https://ai.cretivra.com',
  },
  serviceType: 'Generative AI Engineering & Custom Software',
  description:
    'Engineering custom AI applications, domain-tuned foundation models, internal knowledge assistants, and retrieval-augmented generation systems.',
  areaServed: 'Worldwide',
};

export default function GenerativeAiPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/70 border border-purple-500/30 text-purple-300">
          <Sparkles className="w-3.5 h-3.5" />
          Production Generative AI Systems
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Custom Generative AI Solutions Built for Your Business
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Off-the-shelf consumer chatbots don&apos;t know your products, your policies,
          or your technical terminology. Cretivra AI engineers tailor-made AI
          software, multi-model routing architectures, and document reasoning
          platforms that fit how your company actually works.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link
            href="/#chat-workspace"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all"
          >
            Test Cretivra AI Studio
          </Link>
          <Link
            href="/ai-agents"
            className="px-6 py-3 rounded-xl bg-[#151c2e] hover:bg-[#1a233a] border border-[#232d45] text-white font-semibold text-sm transition-all"
          >
            Explore AI Agents
          </Link>
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
          <Database className="w-6 h-6 text-purple-400" />
          <h2 className="text-base font-bold text-white">Enterprise Knowledge RAG</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            High-accuracy hybrid search pipelines combining vector embeddings and
            keyword BM25 to query internal technical manuals, code repos, and policy
            wikis with zero hallucinated facts.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Multi-Model Cloud Routing</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Intelligently route low-latency queries to lightweight edge models and
            deep multi-step reasoning to frontier models (DeepSeek R1, GPT, Claude,
            Ollama local) while minimizing token expenditure.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
          <Lock className="w-6 h-6 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Air-Gapped &amp; Private Deployments</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            For sensitive defense, legal, healthcare, or financial workloads: run
            open-weight models locally with 100% on-premises data isolation and zero
            external API transmissions.
          </p>
        </div>
      </div>

      {/* Build vs Buy Section */}
      <div className="p-8 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Building vs. Buying: Why Custom AI Wins
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          Generic SaaS subscriptions lock you into proprietary pricing, rigid
          features, and potential data training risks. By partnering with Cretivra AI
          to develop custom software, your company owns its intellectual property,
          tailors features to proprietary operations, and scales without per-seat
          penalties.
        </p>
        <div className="pt-2">
          <Link
            href="/blog#building-vs-buying"
            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:underline"
          >
            Read the full Building vs Buying Guide &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
