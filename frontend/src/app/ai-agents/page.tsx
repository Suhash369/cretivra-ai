import type { Metadata } from 'next';
import { AsuraManusLanding } from '../../components/landing/AsuraManusLanding';

export const metadata: Metadata = {
  title: 'AI Agents | Asura AI Autonomous Intelligence',
  description:
    'Deploy autonomous AI agents that handle multi-step tasks, slide deck generation, web development, and design.',
  alternates: {
    canonical: 'https://ai.cretivra.com/ai-agents',
  },
};

export default function AiAgentsPage() {
  return <AsuraManusLanding />;
}
