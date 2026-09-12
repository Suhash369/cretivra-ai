import type { Metadata } from 'next';
import { StudioClient } from './studio/StudioClient';

export const metadata: Metadata = {
  title: 'Asura AI Studio | Autonomous Intelligence Platform',
  description:
    'Dedicated AI Studio by Cretivra. Access frontier intelligence models, real-time intelligence caching, and autonomous task execution in a standalone workspace.',
  alternates: {
    canonical: 'https://ai.cretivra.com',
  },
};

export default function HomePage() {
  return <StudioClient />;
}
