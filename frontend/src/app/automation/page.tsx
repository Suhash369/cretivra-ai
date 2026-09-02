import type { Metadata } from 'next';
import Link from 'next/link';
import { Workflow, Check, ArrowRight, Gauge, Cpu, Repeat, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Business Process Automation Services',
  description:
    'End-to-end AI automation company building intelligent systems that eliminate repetitive manual workflows, connect legacy software, and accelerate business operations.',
  alternates: {
    canonical: 'https://ai.cretivra.com/automation',
  },
  keywords: [
    'AI automation company',
    'business process automation with AI',
    'AI implementation services',
    'AI business automation company',
    'automated workflows',
  ],
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'AI Business Process Automation',
  provider: {
    '@type': 'Organization',
    name: 'Cretivra AI',
    url: 'https://ai.cretivra.com',
  },
  serviceType: 'Business Process Automation & Systems Integration',
  description:
    'Custom end-to-end business process automation, data pipeline orchestration, and legacy system integration using advanced AI agents.',
  areaServed: 'Worldwide',
};

export default function AutomationPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/70 border border-blue-500/30 text-blue-300">
          <Workflow className="w-3.5 h-3.5" />
          End-to-End Workflow Architecture
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Automate Repetitive Business Processes With AI
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Manual copy-pasting, invoice reconciliation, and cross-tool data syncing
          slow your best people down. Cretivra AI builds resilient, automated
          pipelines that connect your existing software stack into seamless,
          self-running systems.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link
            href="/#chat-workspace"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
          >
            Launch Interactive Studio
          </Link>
          <Link
            href="/generative-ai"
            className="px-6 py-3 rounded-xl bg-[#151c2e] hover:bg-[#1a233a] border border-[#232d45] text-white font-semibold text-sm transition-all"
          >
            Custom AI Software
          </Link>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black">
            1
          </div>
          <h2 className="text-lg font-bold text-white">Cross-Platform Integration</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            We bridge the gap between Slack, Salesforce, HubSpot, Jira, Google
            Workspace, ERPs, and custom internal SQL databases using robust API
            webhooks and intelligent schema adapters.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-black">
            2
          </div>
          <h2 className="text-lg font-bold text-white">Unstructured Data Ingestion</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Transform messy PDFs, customer emails, scanned receipts, and voice
            transcripts into clean, typed relational database entries without manual
            data entry bottlenecks.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-black">
            3
          </div>
          <h2 className="text-lg font-bold text-white">Self-Healing Error Recovery</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Traditional RPA breaks whenever a UI layout shifts. Cretivra AI workflows
            use semantic reasoning to detect edge cases, recover gracefully, and flag
            anomalies for human review.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
            4
          </div>
          <h2 className="text-lg font-bold text-white">Observable Telemetry &amp; Auditing</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Real-time execution dashboards, step-by-step audit trails, and strict
            permission scopes ensure complete visibility into what actions were
            taken, when, and by which model.
          </p>
        </div>
      </div>

      {/* ROI & Impact Metrics */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-[#0d121f] to-[#151c2e] border border-[#232d45] space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-white text-center">
          The Real ROI of AI Business Automation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-xl bg-[#060911]/80 border border-[#232d45]">
            <span className="text-3xl sm:text-4xl font-black text-cyan-400">80%</span>
            <span className="block text-xs font-semibold text-gray-300 mt-1">
              Reduction in Manual Processing Time
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#060911]/80 border border-[#232d45]">
            <span className="text-3xl sm:text-4xl font-black text-blue-400">10x</span>
            <span className="block text-xs font-semibold text-gray-300 mt-1">
              Faster Response to Support &amp; Leads
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#060911]/80 border border-[#232d45]">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400">99.8%</span>
            <span className="block text-xs font-semibold text-gray-300 mt-1">
              Data Extraction Accuracy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
