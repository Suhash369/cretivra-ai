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
  const isStudioOnly =
    pathname === '/studio' ||
    pathname === '/chat' ||
    pathname?.startsWith('/studio/') ||
    pathname?.startsWith('/chat/');

  if (isStudioOnly) {
    return <main className="h-screen w-screen overflow-hidden">{children}</main>;
  }

  return (
    <>
      {header}
      <main className="relative z-10">{children}</main>
      {footer}
    </>
  );
}
