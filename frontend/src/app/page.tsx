import type { Metadata } from 'next';
import { AsuraManusLanding } from '../components/landing/AsuraManusLanding';

export const metadata: Metadata = {
  title: 'Asura AI | Autonomous Intelligence Platform',
  description:
    'Assign any task or ask anything. Asura AI builds presentations, websites, games, and designs with autonomous multi-step intelligence.',
  alternates: {
    canonical: 'https://ai.cretivra.com',
  },
};

export default function HomePage() {
  return <AsuraManusLanding />;
}
