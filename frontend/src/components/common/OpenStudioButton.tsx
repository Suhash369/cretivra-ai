'use client';

import React, { useEffect } from 'react';

interface OpenStudioButtonProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  target?: string;
  rel?: string;
  href?: string;
}

export function OpenStudioButton({
  className = '',
  children = 'Open Studio',
  id,
  target = '_blank',
  rel = 'noopener noreferrer',
  href = '/studio',
}: OpenStudioButtonProps) {
  return (
    <a
      id={id}
      href={href}
      target={target}
      rel={rel}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * Watcher component that listens for #chat-workspace hash changes or initial loads
 * and smoothly scrolls into the studio workspace.
 */
export function StudioScrollWatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollToWorkspace = () => {
      if (window.location.hash !== '#chat-workspace') return;

      let attempts = 0;
      const maxAttempts = 25; // Check for ~2.5 seconds during client hydration
      const interval = setInterval(() => {
        attempts++;
        const el = document.getElementById('chat-workspace');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 100);
    };

    scrollToWorkspace();
    window.addEventListener('hashchange', scrollToWorkspace);
    return () => window.removeEventListener('hashchange', scrollToWorkspace);
  }, []);

  return null;
}
