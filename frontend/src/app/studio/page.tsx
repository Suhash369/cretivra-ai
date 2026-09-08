import type { Metadata } from 'next';
import { StudioClient } from './StudioClient';

export const metadata: Metadata = {
  title: 'Asura AI Studio | Cretivra Intelligence Platform',
  description:
    'Dedicated AI Studio by Cretivra. Access frontier intelligence models, real-time intelligence caching, and AI image generation in a standalone workspace.',
};

export default function StudioPage() {
  return <StudioClient />;
}
