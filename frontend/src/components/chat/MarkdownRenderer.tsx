'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Table as TableIcon,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { GeneratedImageCard } from './GeneratedImageCard';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Interactive Code Block with Language Tag, Word Wrap Toggle, and Copy Button
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl overflow-hidden bg-[#0a0e17] border border-slate-800/90 shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#101623] border-b border-slate-800/80 text-slate-400 select-none">
        <div className="flex items-center gap-1.5 font-medium text-[11px] text-slate-300">
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language || 'code'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWrap(!wrap)}
            className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors"
            title="Toggle word wrap"
          >
            {wrap ? 'Unwrap' : 'Wrap'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre
        className={`p-4 text-[13px] leading-relaxed text-slate-200 ${
          wrap ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto'
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Interactive Table Block with Header, Responsive Horizontal Scroll, and Copy-as-TSV
function TableBlock({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyTable = () => {
    if (!containerRef.current) return;
    const tableEl = containerRef.current.querySelector('table');
    if (!tableEl) return;

    const rows = Array.from(tableEl.querySelectorAll('tr'));
    const tsv = rows
      .map((r) =>
        Array.from(r.querySelectorAll('th, td'))
          .map((c) => (c.textContent || '').trim().replace(/\s+/g, ' '))
          .join('\t')
      )
      .join('\n');

    navigator.clipboard?.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="my-4 rounded-xl border border-slate-700/60 dark:border-slate-700/60 bg-slate-900/40 dark:bg-slate-900/50 shadow-sm overflow-hidden backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/70 dark:bg-slate-800/80 border-b border-slate-700/60 text-[11px] text-slate-400 font-mono select-none">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Table</span>
        </div>
        <button
          type="button"
          onClick={handleCopyTable}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
          title="Copy table (ready to paste into Excel, Google Sheets, or Notion)"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied Table!' : 'Copy Table'}</span>
        </button>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm border-collapse min-w-[520px]">
          {children}
        </table>
      </div>
    </div>
  );
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`chat-markdown prose-asura text-slate-200 text-[14.5px] leading-relaxed font-sans ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Tables (ChatGPT / Claude / Gemini card-styled)
          table({ children }) {
            return <TableBlock>{children}</TableBlock>;
          },
          thead({ children, ...props }) {
            return (
              <thead className="bg-slate-800/80 dark:bg-slate-800/90 border-b border-slate-700/70 text-slate-200" {...props}>
                {children}
              </thead>
            );
          },
          tbody({ children, ...props }) {
            return (
              <tbody className="divide-y divide-slate-800/60 text-slate-300" {...props}>
                {children}
              </tbody>
            );
          },
          tr({ children, ...props }) {
            return (
              <tr className="hover:bg-slate-800/30 transition-colors even:bg-slate-800/20" {...props}>
                {children}
              </tr>
            );
          },
          th({ children, ...props }) {
            return (
              <th
                className="px-4 py-3 text-xs font-semibold tracking-wider text-slate-200 dark:text-slate-100 text-left uppercase"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td
                className="px-4 py-3 text-[13.5px] text-slate-300 dark:text-slate-300 align-top leading-relaxed whitespace-normal break-words"
                {...props}
              >
                {children}
              </td>
            );
          },

          // Headings with crisp hierarchy and spacing
          h1({ children, ...props }) {
            return (
              <h1
                className="text-2xl font-bold tracking-tight text-white mt-6 mb-3 pb-2 border-b border-slate-800/80 leading-snug"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2
                className="text-xl font-bold tracking-tight text-white mt-5 mb-2.5 leading-snug"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3
                className="text-base font-semibold text-slate-100 mt-4 mb-2 leading-snug"
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4({ children, ...props }) {
            return (
              <h4
                className="text-sm font-semibold text-slate-200 mt-3 mb-1.5 leading-snug"
                {...props}
              >
                {children}
              </h4>
            );
          },

          // Paragraphs & Typographic styling
          p({ children, ...props }) {
            return (
              <p className="mb-3.5 leading-relaxed text-[14.5px] text-slate-200 last:mb-0" {...props}>
                {children}
              </p>
            );
          },
          strong({ children, ...props }) {
            return (
              <strong className="font-semibold text-white" {...props}>
                {children}
              </strong>
            );
          },
          em({ children, ...props }) {
            return (
              <em className="italic text-slate-300" {...props}>
                {children}
              </em>
            );
          },

          // Lists with clean indentation & colored bullets
          ul({ children, ...props }) {
            return (
              <ul className="my-3 pl-6 list-disc space-y-1.5 marker:text-cyan-400 text-slate-200" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="my-3 pl-6 list-decimal space-y-1.5 marker:font-semibold marker:text-cyan-400 text-slate-200" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="leading-relaxed text-[14.5px] text-slate-200 pl-1" {...props}>
                {children}
              </li>
            );
          },

          // Blockquotes & Callouts
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-cyan-500/80 bg-cyan-950/20 rounded-r-xl px-4 py-2.5 my-3.5 text-slate-300 italic text-[14px]"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // Dividers
          hr({ ...props }) {
            return (
              <hr
                className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-slate-700/70 to-transparent"
                {...props}
              />
            );
          },

          // Links
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/40 hover:decoration-cyan-400 transition-colors inline-flex items-center gap-0.5 font-medium"
                {...props}
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 opacity-70 inline ml-0.5" />
              </a>
            );
          },

          // Images
          img({ src, alt }) {
            const imageSrc = typeof src === 'string' ? src : undefined;
            return <GeneratedImageCard src={imageSrc} alt={alt} />;
          },

          // Code blocks & Inline code pills
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} code={codeText} />;
            }
            if (!inline && codeText.includes('\n')) {
              return <CodeBlock language="text" code={codeText} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[12.5px] font-medium bg-slate-800/90 text-cyan-300 border border-slate-700/60 dark:bg-slate-800/90 dark:text-cyan-300 dark:border-slate-700/50 shadow-xs inline-block align-baseline"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
