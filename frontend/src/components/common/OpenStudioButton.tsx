'use client';

import React, { useEffect } from 'react';

interface OpenStudioButtonProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  target?: string;
  rel?: string;
  href?: string;
  openImageStudio?: boolean;
}

export function OpenStudioButton({
  className = '',
  children = 'Open Studio',
  id,
  target = '_blank',
  rel = 'noopener noreferrer',
  href = '/studio',
  openImageStudio = false,
}: OpenStudioButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (openImageStudio) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-image-studio'));
      }
    }
  };

  const finalHref = openImageStudio
    ? href.includes('?')
      ? `${href}&studio=image`
      : `${href}?studio=image`
    : href;

  return (
    <a
      id={id}
      href={finalHref}
      target={target}
      rel={rel}
      className={className}
      onClick={handleClick}
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
