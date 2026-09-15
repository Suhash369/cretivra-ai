'use client';

import React, { useState } from 'react';
import { Globe, ExternalLink, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import type { SourceLink } from '../../types';

interface SourceLinksCardProps {
  sources?: SourceLink[];
  messageContent?: string;
}

// Utility to parse markdown links and bare URLs if sources array is empty
function extractSourcesFromMarkdown(content?: string): SourceLink[] {
  if (!content) return [];
  const found: SourceLink[] = [];
  const seenUrls = new Set<string>();

  // 1. Match Markdown links [Title](URL)
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      try {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        found.push({ title, url, domain });
      } catch {
        found.push({ title, url, domain: 'web' });
      }
    }
  }

  // 2. Match bare URLs
  if (found.length === 0) {
    const bareUrlRegex = /(https?:\/\/[^\s<>)"]+)/g;
    while ((match = bareUrlRegex.exec(content)) !== null) {
      const url = match[1].trim();
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        try {
          const domain = new URL(url).hostname.replace(/^www\./, '');
          found.push({ title: domain, url, domain });
        } catch {
          found.push({ title: 'External Source', url, domain: 'web' });
        }
      }
    }
  }

  return found.slice(0, 8);
}

export const SourceLinksCard: React.FC<SourceLinksCardProps> = ({ sources, messageContent }) => {
  const [expanded, setExpanded] = useState(true);
  const [failedFavicons, setFailedFavicons] = useState<Record<string, boolean>>({});

  // Merge explicit sources with any extracted links
  const activeSources = React.useMemo(() => {
    if (sources && sources.length > 0) {
      return sources;
    }
    return extractSourcesFromMarkdown(messageContent);
  }, [sources, messageContent]);

  if (!activeSources || activeSources.length === 0) {
    return null;
  }

  return (
    <div className="my-3 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/70 dark:bg-[#0c101a]/80 backdrop-blur-sm overflow-hidden shadow-xs transition-all animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/70 dark:bg-[#121824]/90 border-b border-slate-200/80 dark:border-slate-800/80 select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-cyan-500/10 dark:bg-cyan-400/15 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Globe className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 tracking-tight">
            Sources &amp; Citations
          </span>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-100/90 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300/60 dark:border-cyan-700/60">
            {activeSources.length} {activeSources.length === 1 ? 'source' : 'sources'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            • Verified Web Intelligence
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <span>{expanded ? 'Collapse' : 'Show All'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Sources Grid / List */}
      {expanded && (
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeSources.map((s, idx) => {
              const domain = s.domain || (s.url ? (() => {
                try {
                  return new URL(s.url).hostname.replace(/^www\./, '');
                } catch {
                  return 'web';
                }
              })() : 'web');

              const faviconUrl = domain && domain !== 'web'
                ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
                : null;

              const hasFaviconFailed = Boolean(failedFavicons[domain]);

              return (
                <a
                  key={`${s.url}-${idx}`}
                  href={s.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800/90 hover:border-cyan-500/60 dark:hover:border-cyan-400/60 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer no-underline text-left"
                  title={s.title}
                >
                  <div className="space-y-1.5">
                    {/* Top row: Favicon + domain badge + citation index */}
                    <div className="flex items-center justify-between gap-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {faviconUrl && !hasFaviconFailed ? (
                          <img
                            src={faviconUrl}
                            alt=""
                            className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain"
                            onError={() => {
                              setFailedFavicons((prev) => ({ ...prev, [domain]: true }));
                            }}
                          />
                        ) : (
                          <Link2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        )}
                        <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                          {domain}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 shrink-0">
                        [{idx + 1}]
                      </span>
                    </div>

                    {/* Source Title */}
                    <h4 className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                      {s.title || domain}
                    </h4>

                    {/* Snippet preview if present */}
                    {s.snippet && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                        {s.snippet}
                      </p>
                    )}
                  </div>

                  {/* Bottom link indicator */}
                  <div className="flex items-center justify-end pt-2 text-[10.5px] text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    <span className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Visit source</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
