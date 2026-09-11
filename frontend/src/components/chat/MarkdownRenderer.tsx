'use client';

import React, { useState, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Copy,
  Check,
  Table as TableIcon,
  FileCode,
  FileDown,
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
    <div className="my-3.5 rounded-xl overflow-hidden bg-[#0a0e17] border border-slate-300/60 dark:border-slate-800/90 shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#121824] border-b border-slate-800/80 text-slate-300 select-none">
        <div className="flex items-center gap-1.5 font-medium text-[11px] text-slate-200">
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language || 'code'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWrap(!wrap)}
            className="px-2 py-0.5 rounded text-[10px] text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Toggle word wrap"
          >
            {wrap ? 'Unwrap' : 'Wrap'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
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

// Helper to transform <br> or <br/> tags inside table cells or text into actual React <br /> elements
function renderWithLineBreaks(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      if (/<br\s*\/?>/i.test(child)) {
        const parts = child.split(/<br\s*\/?>/i);
        return parts.flatMap((part, i) =>
          i === 0 ? [part] : [<br key={i} className="my-1" />, part]
        );
      }
      return child;
    }
    if (React.isValidElement(child) && child.props && (child.props as any).children) {
      return React.cloneElement(child, {
        ...(child.props as any),
        children: renderWithLineBreaks((child.props as any).children),
      });
    }
    return child;
  });
}

// Interactive Table Block with Clean Light/Dark Theme, Horizontal Scroll, and Copy-as-TSV
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
      className="my-4 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 text-[11px] font-mono select-none">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold">
          <TableIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Table View</span>
        </div>
        <button
          type="button"
          onClick={handleCopyTable}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer font-sans"
          title="Copy table (ready to paste into Excel, Google Sheets, or Notion)"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied Table!' : 'Copy Table'}</span>
        </button>
      </div>
      <div className="overflow-x-auto w-full custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse min-w-[600px] table-auto">
          {children}
        </table>
      </div>
    </div>
  );
}

// Preprocessor to normalize LaTeX math expressions from AI responses
function preprocessMarkdown(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. Convert standard LaTeX \[ ... \] display math to $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$\n$1\n$$');

  // 2. Convert standard LaTeX \( ... \) inline math to $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 3. Normalize bracketed math blocks like `[ \boxed{...} ]` or `[ I = \frac{V}{R} ]`
  // Matches standalone `[` followed by typical LaTeX math commands ending with `]`
  text = text.replace(
    /^\s*\[\s*(\\boxed\{[\s\S]*?\}|\\frac\{[\s\S]*?\}|[\w\s=+\-*/(),.]*?\\[a-zA-Z]+[\s\S]*?)\s*\]\s*$/gm,
    (match, formula) => {
      // Guard against checkboxes [x] or markdown links [text](url)
      if (formula.startsWith('x]') || formula.startsWith(' ]') || formula.includes('](')) {
        return match;
      }
      return `$$\n${formula.trim()}\n$$`;
    }
  );

  return text;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  const processedContent = useMemo(() => preprocessMarkdown(content), [content]);

  return (
    <div className={`chat-markdown prose-asura text-slate-800 dark:text-slate-200 text-[14.5px] leading-relaxed font-sans ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Tables (ChatGPT / Claude / Gemini card-styled with perfect Light & Dark theme contrast)
          table({ children }) {
            return <TableBlock>{children}</TableBlock>;
          },
          thead({ children, ...props }) {
            return (
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200" {...props}>
                {children}
              </thead>
            );
          },
          tbody({ children, ...props }) {
            return (
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 text-slate-800 dark:text-slate-300" {...props}>
                {children}
              </tbody>
            );
          },
          tr({ children, ...props }) {
            return (
              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 even:bg-slate-50/40 dark:even:bg-slate-800/20 transition-colors" {...props}>
                {children}
              </tr>
            );
          },
          th({ children, ...props }) {
            return (
              <th
                className="px-4 py-3 text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-100 text-left uppercase font-sans whitespace-nowrap min-w-[120px]"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td
                className="px-4 py-3 text-[13.5px] text-slate-800 dark:text-slate-300 align-top leading-relaxed whitespace-normal break-normal font-sans min-w-[130px]"
                {...props}
              >
                {renderWithLineBreaks(children)}
              </td>
            );
          },

          // Headings with crisp hierarchy, high contrast in both themes
          h1({ children, ...props }) {
            return (
              <h1
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800/80 leading-snug"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2
                className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-5 mb-2.5 leading-snug"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3
                className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-4 mb-2 leading-snug"
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4({ children, ...props }) {
            return (
              <h4
                className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1.5 leading-snug"
                {...props}
              >
                {children}
              </h4>
            );
          },

          // Paragraphs & Typographic styling
          p({ children, ...props }) {
            return (
              <p className="mb-3.5 leading-relaxed text-[14.5px] text-slate-800 dark:text-slate-200 last:mb-0" {...props}>
                {children}
              </p>
            );
          },
          strong({ children, ...props }) {
            return (
              <strong className="font-semibold text-slate-950 dark:text-white" {...props}>
                {children}
              </strong>
            );
          },
          em({ children, ...props }) {
            return (
              <em className="italic text-slate-700 dark:text-slate-300" {...props}>
                {children}
              </em>
            );
          },

          // Lists with clean indentation & colored bullets
          ul({ children, ...props }) {
            return (
              <ul className="my-3 pl-6 list-disc space-y-1.5 marker:text-cyan-600 dark:marker:text-cyan-400 text-slate-800 dark:text-slate-200" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="my-3 pl-6 list-decimal space-y-1.5 marker:font-semibold marker:text-cyan-600 dark:marker:text-cyan-400 text-slate-800 dark:text-slate-200" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="leading-relaxed text-[14.5px] text-slate-800 dark:text-slate-200 pl-1" {...props}>
                {children}
              </li>
            );
          },

          // Blockquotes & Callouts
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/20 rounded-r-xl px-4 py-2.5 my-3.5 text-slate-700 dark:text-slate-300 italic text-[14px]"
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
                className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/70 to-transparent"
                {...props}
              />
            );
          },

          // Links (with rich styling for PDF & PPTX file downloads)
          a({ href, children, ...props }) {
            const isDownload = Boolean(
              href?.includes('/files/download/') ||
              href?.endsWith('.pdf') ||
              href?.endsWith('.pptx') ||
              href?.endsWith('.docx')
            );

            if (isDownload) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 my-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs no-underline shadow-md shadow-cyan-600/25 hover:shadow-cyan-600/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  {...props}
                >
                  <FileDown className="w-4 h-4 text-cyan-200" />
                  <span>{children}</span>
                </a>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/40 hover:decoration-cyan-400 transition-colors inline-flex items-center gap-0.5 font-medium"
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
                className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[12.5px] font-medium bg-slate-100 dark:bg-slate-800/90 text-cyan-800 dark:text-cyan-300 border border-slate-200 dark:border-slate-700/50 shadow-xs inline-block align-baseline"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
