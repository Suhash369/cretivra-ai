import type { Metadata } from 'next';
import { PlaygroundClient } from './PlaygroundClient';

export const metadata: Metadata = {
  title: 'Asura Playground | Autonomous Execution Engine',
  description:
    'Build, Research, Analyze, and Automate with Asura AI Playground. Multi-step autonomous planning, tool execution, and artifact compilation.',
  alternates: {
    canonical: 'https://asura-ai.cretivra.com/playground',
  },
};

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
