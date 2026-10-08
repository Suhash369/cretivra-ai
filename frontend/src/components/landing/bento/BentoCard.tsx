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
  footerCaption?: string;
  onClickCard?: () => void;
  className?: string;
  isHorizontal?: boolean;
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
  footerCaption,
  onClickCard,
  className = '',
  isHorizontal = false,
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
      className={`h-full w-full ${entranceClass} ${className}`}
    >
      <GlowSurface
        accentColor={accentColor}
        glowRgba={glowRgba}
        borderGlowRgba={borderGlowRgba}
        breatheClass={breatheClass}
        onClick={onClickCard}
        aria-label={title}
        className={`h-full w-full p-3.5 sm:p-4.5 flex flex-col justify-between relative overflow-hidden rounded-2xl ${
          isDraggingOver ? 'ring-2 ring-emerald-500 bg-emerald-500/5' : ''
        }`}
      >
        {/* Top Header Row with Title, Chevron, Subtitle */}
        <div className={`relative z-10 ${isHorizontal ? 'max-w-[55%] sm:max-w-[58%]' : 'w-full'}`}>
          <div className="flex items-center gap-1.5 text-[14px] sm:text-[15px] font-semibold text-[var(--foreground)] tracking-tight">
            <span style={{ color: 'inherit' }} className="group-hover:text-[var(--accent-color)] transition-colors truncate">
              {title}
            </span>
            <ChevronRight
              size={13}
              className="text-[var(--muted-foreground)] group-hover:translate-x-1 group-hover:text-[var(--accent-color)] transition-all shrink-0"
            />
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        </div>

        {/* Center / Side Illustration Viewport */}
        {isHorizontal ? (
          <div className="absolute right-2 sm:right-3.5 top-2.5 bottom-10 flex items-center justify-end pointer-events-none z-0 overflow-hidden">
            {illustration}
          </div>
        ) : (
          <div className="my-auto relative z-10 flex items-center justify-center pointer-events-none overflow-hidden py-1">
            {illustration}
          </div>
        )}

        {/* Bottom Quick Action Chips or Caption */}
        {chips.length > 0 ? (
          <div
            className="relative z-20 flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar scrollbar-none pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {chips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={chip.onClick}
                className="shrink-0 px-2.5 py-0.5 sm:py-1 rounded-full text-[10.5px] sm:text-[11px] font-medium bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : footerCaption ? (
          <div className="relative z-20 text-[10.5px] sm:text-[11px] text-[var(--muted-foreground)] font-medium text-center truncate pt-1">
            {footerCaption}
          </div>
        ) : null}
      </GlowSurface>
    </div>
  );
}
