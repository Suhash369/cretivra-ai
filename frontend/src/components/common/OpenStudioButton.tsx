'use client';

import React, { useEffect } from 'react';

interface OpenStudioButtonProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

export function OpenStudioButton({
  className = '',
  children = 'Open Studio',
  id,
}: OpenStudioButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === 'undefined') return;

    const isHome = window.location.pathname === '/' || window.location.pathname === '';
    const workspaceEl = document.getElementById('chat-workspace');

    if (isHome && workspaceEl) {
      e.preventDefault();
      workspaceEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.history?.pushState) {
        window.history.pushState(null, '', '#chat-workspace');
      }
      return;
    }
  };

  return (
    <a
      id={id}
      href="/#chat-workspace"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * Watcher component that listens for #chat-workspace hash changes or initial loads
 * and smoothly scrolls into the studio.
 */
export function StudioScrollWatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAndScroll = () => {
      if (window.location.hash === '#chat-workspace') {
        setTimeout(() => {
          const el = document.getElementById('chat-workspace');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      }
    };

    checkAndScroll();
    window.addEventListener('hashchange', checkAndScroll);
    return () => window.removeEventListener('hashchange', checkAndScroll);
  }, []);

  return null;
}
