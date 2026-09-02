import type { Metadata } from 'next';
import Link from 'next/link';
import { Bot, CheckCircle, ArrowRight, Layers, Users, Zap, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Agents for Business & Workflow Automation',
  description:
    'Deploy autonomous AI agents that handle support tickets, process multi-step workflows, and take action across your internal tools. Built by Cretivra AI.',
  alternates: {
    canonical: 'https://ai.cretivra.com/ai-agents',
  },
  keywords: [
    'AI agents for business',
    'AI agent development company',
    'AI agents for customer support automation',
    'autonomous AI agents',
    'AI agent vs chatbot',
  ],
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'AI Agent Development for Business',
  provider: {
    '@type': 'Organization',
    name: 'Cretivra AI',
    url: 'https://ai.cretivra.com',
  },
  serviceType: 'AI Agent Development & Autonomous Workflows',
  description:
    'Custom autonomous AI agent design, development, and deployment for enterprise workflow automation and customer support.',
  areaServed: 'Worldwide',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'AI Agent Capabilities',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Customer Support AI Agents',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Internal Operations & Process Agents',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Multi-Agent Autonomous Orchestration',
        },
      },
    ],
  },
};

export default function AiAgentsPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
          <Bot className="w-3.5 h-3.5" />
          Autonomous Business Intelligence
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          AI Agents for Business That Execute, Not Just Chat
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Standard chatbots output text. Cretivra AI agents take action. We design
          and deploy intelligent agents capable of understanding context, making
          operational decisions, calling internal APIs, and resolving multi-step
          business workflows independently.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link
            href="/#chat-workspace"
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
          >
            Test Live AI Models
          </Link>
          <Link
            href="/automation"
            className="px-6 py-3 rounded-xl bg-[#151c2e] hover:bg-[#1a233a] border border-[#232d45] text-white font-semibold text-sm transition-all"
          >
            Explore System Automation
          </Link>
        </div>
      </div>

      {/* Agents vs Chatbots Comparison Table */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-white text-center">
          AI Agent vs. Chatbot — What&apos;s Actually the Difference?
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[#232d45] bg-[#0d121f]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-[#232d45] bg-[#151c2e]/60 text-gray-300">
              <tr>
                <th className="p-4 font-bold">Feature</th>
                <th className="p-4 font-bold text-gray-400">Traditional Chatbot</th>
                <th className="p-4 font-bold text-cyan-400">Cretivra AI Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232d45]/60 text-gray-300">
              <tr>
                <td className="p-4 font-semibold text-white">Primary Capability</td>
                <td className="p-4 text-gray-400">Answers static questions via keyword matching or basic LLM text.</td>
                <td className="p-4 text-cyan-300 font-medium">Autonomously completes multi-step end-to-end tasks.</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Action &amp; Tool Execution</td>
                <td className="p-4 text-gray-400">None — informs the user to visit an external link or portal.</td>
                <td className="p-4 text-cyan-300 font-medium">Executes database queries, web searches, API endpoints, and CRM updates.</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">State &amp; Context Memory</td>
                <td className="p-4 text-gray-400">Single session memory, easily confused by multi-step requirements.</td>
                <td className="p-4 text-cyan-300 font-medium">Persistent state management, document grounding, and historical memory.</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Human In The Loop</td>
                <td className="p-4 text-gray-400">Binary handoff to human support reps when stuck.</td>
                <td className="p-4 text-cyan-300 font-medium">Intelligent confidence thresholds with precise context handover.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Core Use Cases */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-white text-center">
          Proven Enterprise Agent Workflows
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
            <Users className="w-6 h-6 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Customer Support Resolution</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Resolve inquiries, issue refunds according to company policy, diagnose
              account status, and update CRM records automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
            <Layers className="w-6 h-6 text-blue-400" />
            <h3 className="font-bold text-white text-base">Recruitment &amp; Candidate Triage</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Parse technical resumes, evaluate candidates against rubrics, schedule
              screening rounds, and draft candidate evaluation briefs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-3">
            <Zap className="w-6 h-6 text-purple-400" />
            <h3 className="font-bold text-white text-base">Operational Back-Office Triage</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Reconcile invoice discrepancies, ingest incoming supplier documents,
              cross-verify inventory, and trigger purchase approval flows.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Architecture */}
      <div className="p-8 rounded-2xl bg-[#0d121f] border border-[#232d45] space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          Enterprise Security &amp; Compliance
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Engineered for Enterprise Reliability &amp; Data Privacy
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          Every Cretivra AI agent is built on deterministic tool-use standards,
          guardrailed system prompts, and rigorous telemetry. Your corporate data
          remains strictly isolated — deployable on your private cloud, on-premises
          clusters, or secure hybrid infrastructure.
        </p>
        <div className="pt-2">
          <Link
            href="/#chat-workspace"
            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:underline"
          >
            Launch Cretivra AI Studio to test reasoning &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
