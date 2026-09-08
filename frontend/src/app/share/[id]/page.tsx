import type { Metadata } from 'next';
import { ShareClient } from './ShareClient';

export const metadata: Metadata = {
  title: 'Shared Conversation | Asura AI by Cretivra',
  description: 'View a shared conversation snapshot on Asura AI by Cretivra.',
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShareClient conversationId={id} />;
}
