import type { Metadata } from 'next';
import { StudioClient } from '../studio/StudioClient';

export const metadata: Metadata = {
  title: 'AI Agents | Asura AI Autonomous Intelligence Studio',
  description:
    'Autonomous AI agents capable of multi-step task execution, presentations, web apps, and design.',
  alternates: {
    canonical: 'https://ai.cretivra.com/ai-agents',
  },
};

export default function AiAgentsPage() {
  return <StudioClient />;
}
