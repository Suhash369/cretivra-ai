import type { Metadata } from 'next';
import { TestBenchClient } from './TestBenchClient';

export const metadata: Metadata = {
  title: 'AI Model Test Bench & Performance Arena | Asura AI by Cretivra',
  description:
    'Interactive model test bench and performance arena. Benchmark Asura AI models side-by-side against GPT-4o, Claude 3.5 Sonnet, and Gemini 2.0 with live TTFT and throughput metrics.',
};

export default function TestBenchPage() {
  return <TestBenchClient />;
}
