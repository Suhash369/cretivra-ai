import type { Metadata } from 'next';
import { StudioClient } from '../studio/StudioClient';

export const metadata: Metadata = {
  title: 'Asura AI Chat | Cretivra Intelligence Platform',
  description:
    'Dedicated AI Chat by Cretivra. Access frontier intelligence models and tools in a standalone workspace.',
};

export default function ChatPage() {
  return <StudioClient />;
}
