import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Insights & Engineering Blog',
  description:
    'Practical guides, architecture breakdowns, and ROI analyses on AI agents, business automation, and custom generative AI software.',
  alternates: {
    canonical: 'https://ai.cretivra.com/blog',
  },
  keywords: [
    'what is an AI agent',
    'AI agents vs chatbots',
    'how much does custom AI software cost',
    'AI business automation guide',
    'generative AI vs agentic AI',
  ],
};

const ARTICLES = [
  {
    slug: 'what-is-an-ai-agent',
    title: 'What Is an AI Agent? A Practical Guide for Business Owners',
    summary:
      'Understand how autonomous AI agents move past simple conversational prompts to take concrete actions, interface with APIs, and run multi-step operations.',
    category: 'AI Agents',
    readTime: '6 min read',
    targetService: '/ai-agents',
    serviceLabel: 'Explore AI Agents',
  },
  {
    slug: 'ai-agents-vs-chatbots',
    title: 'AI Agents vs. Chatbots: What’s Actually the Difference?',
    summary:
      'Why chatbots generate text while agents generate outcomes. A side-by-side technical and economic comparison for enterprise leadership.',
    category: 'Architecture',
    readTime: '5 min read',
    targetService: '/ai-agents',
    serviceLabel: 'Explore AI Agents',
  },
  {
    slug: '5-processes-to-automate-with-ai',
    title: '5 Business Processes You Can Automate With AI Today',
    summary:
      'From inbound customer support ticket resolution to invoice matching and cross-CRM reconciliation, five proven workflows with measurable ROI.',
    category: 'Automation',
    readTime: '8 min read',
    targetService: '/automation',
    serviceLabel: 'Business Process Automation',
  },
  {
    slug: 'custom-ai-software-cost-2026',
    title: 'How Much Does Custom AI Software Actually Cost in 2026?',
    summary:
      'A transparent breakdown of AI engineering costs, API token consumption, model fine-tuning, and infrastructure hosting for small and mid-market firms.',
    category: 'Strategy',
    readTime: '7 min read',
    targetService: '/generative-ai',
    serviceLabel: 'Custom AI Solutions',
  },
  {
    slug: 'generative-ai-vs-agentic-ai',
    title: 'Generative AI vs. Agentic AI: What Businesses Need to Know',
    summary:
      'Generative AI creates content; Agentic AI orchestrates goal-oriented actions. Why modern enterprises need both architectures in tandem.',
    category: 'Engineering',
    readTime: '6 min read',
    targetService: '/generative-ai',
    serviceLabel: 'Generative AI Engineering',
  },
  {
    slug: 'business-readiness-ai-automation',
    title: 'How to Know If Your Business Is Ready for AI Automation',
    summary:
      'A clear 5-point audit checklist covering data hygiene, workflow repetitiveness, and employee tool adoption before embarking on AI projects.',
    category: 'Consulting',
    readTime: '5 min read',
    targetService: '/automation',
    serviceLabel: 'AI Implementation',
  },
  {
    slug: 'ai-recruitment-automation',
    title: 'AI in Recruitment: How Automation Is Changing Hiring',
    summary:
      'How talent teams screen resumes fairly, automate interview logistics, and extract deep candidate technical competencies in seconds.',
    category: 'Case Study',
    readTime: '7 min read',
    targetService: '/ai-agents',
    serviceLabel: 'AI Agent Triage',
  },
  {
    slug: 'real-roi-ai-automation-smb',
    title: 'The Real ROI of AI Automation for Small and Mid-Size Businesses',
    summary:
      'Real-world numbers showing how SMBs replace 20+ hours of manual weekly overhead per employee while scaling operations without linear headcount.',
    category: 'ROI & Finance',
    readTime: '6 min read',
    targetService: '/automation',
    serviceLabel: 'Automation ROI',
  },
  {
    slug: 'building-vs-buying',
    title: 'Building vs. Buying: Custom AI Software vs. Off-the-Shelf Tools',
    summary:
      'Compare vendor lock-in, data privacy ownership, and long-term TCO when choosing between generic SaaS AI features and tailored custom software.',
    category: 'Strategy',
    readTime: '8 min read',
    targetService: '/generative-ai',
    serviceLabel: 'Custom AI Software',
  },
  {
    slug: 'customer-support-ai-agents-2026',
    title: 'How AI Agents Are Automating Customer Support in 2026',
    summary:
      'Modern support desks handle tier-1 and tier-2 inquiries autonomously while maintaining high CSAT and providing seamless human escalation.',
    category: 'Support',
    readTime: '5 min read',
    targetService: '/ai-agents',
    serviceLabel: 'Support Agents',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://ai.cretivra.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: 'https://ai.cretivra.com/blog',
    },
  ],
};

export default function BlogHubPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
          <BookOpen className="w-3.5 h-3.5" />
          Knowledge Hub &amp; Practical Guides
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Cretivra AI Engineering &amp; Strategy
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
          Insights on deploying practical AI agents, business process automation,
          and production-grade custom software.
        </p>
      </div>

      {/* Article Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ARTICLES.map((article, idx) => (
          <article
            key={idx}
            id={article.slug}
            className="p-6 rounded-2xl bg-[#0d121f] border border-[#232d45] hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1 font-semibold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-500/20">
                  <Tag className="w-3 h-3" />
                  {article.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                {article.title}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                {article.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-[#232d45]/60 flex items-center justify-between">
              <Link
                href={article.targetService}
                className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                {article.serviceLabel} &rarr;
              </Link>
              <Link
                href="/#chat-workspace"
                className="text-[11px] text-gray-400 hover:text-white transition-colors"
              >
                Test in Studio
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
