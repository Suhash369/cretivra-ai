import React from 'react';
import { ChevronRight } from 'lucide-react';
import { GlowSurface } from './GlowSurface';

export interface BentoChip {
  label: string;
  onClick: (e: React.MouseEvent) => void;
}

interface BentoCardProps {
  title: string;
  subtitle: string;
  accentColor: string;
  glowRgba: string;
  borderGlowRgba: string;
  breatheClass?: string;
  entranceClass?: string;
  illustration: React.ReactNode;
  chips?: BentoChip[];
  onClickCard?: () => void;
  className?: string;
  contentClassName?: string;
  // Drag and drop handlers for file card
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDraggingOver?: boolean;
}

export function BentoCard({
  title,
  subtitle,
  accentColor,
  glowRgba,
  borderGlowRgba,
  breatheClass,
  entranceClass = '',
  illustration,
  chips = [],
  onClickCard,
  className = '',
  contentClassName = '',
  onDragOver,
  onDragLeave,
  onDrop,
  isDraggingOver,
}: BentoCardProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`h-full ${entranceClass} ${className}`}
    >
      <GlowSurface
        accentColor={accentColor}
        glowRgba={glowRgba}
        borderGlowRgba={borderGlowRgba}
        breatheClass={breatheClass}
        onClick={onClickCard}
        aria-label={title}
        className={`h-full p-4 sm:p-5 flex flex-col justify-between ${
          isDraggingOver ? 'ring-2 ring-emerald-500 bg-emerald-500/5' : ''
        }`}
      >
        {/* Top Header Row with Title, Chevron, Subtitle */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-[var(--foreground)] tracking-tight">
              <span style={{ color: 'inherit' }} className="group-hover:text-[var(--accent-color)] transition-colors">
                {title}
              </span>
              <ChevronRight
                size={14}
                className="text-[var(--muted-foreground)] group-hover:translate-x-1 group-hover:text-[var(--accent-color)] transition-all shrink-0"
              />
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Center/Side Illustration Area */}
        <div className={`my-auto flex items-center justify-center ${contentClassName}`}>
          {illustration}
        </div>

        {/* Bottom Quick Action Chips */}
        {chips.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5 z-20" onClick={(e) => e.stopPropagation()}>
            {chips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={chip.onClick}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </GlowSurface>
    </div>
  );
}
