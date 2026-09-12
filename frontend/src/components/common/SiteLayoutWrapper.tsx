'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface SiteLayoutWrapperProps {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
}

export function SiteLayoutWrapper({
  children,
  header,
  footer,
}: SiteLayoutWrapperProps) {
  const pathname = usePathname();
  const isCleanCanvas =
    pathname === '/' ||
    pathname === '/ai-agents' ||
    pathname === '/studio' ||
    pathname === '/chat' ||
    pathname === '/test-bench' ||
    pathname?.startsWith('/studio/') ||
    pathname?.startsWith('/chat/') ||
    pathname?.startsWith('/test-bench/');

  if (isCleanCanvas) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <>
      {header}
      <main className="relative z-10">{children}</main>
      {footer}
    </>
  );
}
