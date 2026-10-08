import React, { useState, useRef, useCallback, useEffect } from 'react';

interface GlowSurfaceProps {
  children: React.ReactNode;
  className?: string;
  accentColor: string;
  glowRgba: string;
  borderGlowRgba: string;
  breatheClass?: string;
  interactive?: boolean;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  'aria-label'?: string;
}

export function GlowSurface({
  children,
  className = '',
  accentColor,
  glowRgba,
  borderGlowRgba,
  breatheClass = 'bento-breathe-1',
  interactive = true,
  onClick,
  role = 'button',
  tabIndex = 0,
  onKeyDown,
  'aria-label': ariaLabel,
}: GlowSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isTouchDevice || e.pointerType === 'touch') return;
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    });
  }, [isTouchDevice]);

  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchDevice && e.pointerType !== 'touch') {
      setIsHovered(true);
    }
  }, [isTouchDevice]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setMousePos(null);
  }, []);

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={surfaceRef}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={handleKeyDownInternal}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        // Dynamic CSS variables for cursor tracking and custom glow
        ['--mx' as any]: mousePos ? `${mousePos.x}px` : '50%',
        ['--my' as any]: mousePos ? `${mousePos.y}px` : '50%',
        ['--accent-color' as any]: accentColor,
      }}
      className={`relative group rounded-2xl overflow-hidden transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
        interactive
          ? 'cursor-pointer hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.985] ease-[cubic-bezier(0.22,1,0.36,1)]'
          : ''
      } bg-[var(--surface)] border border-[var(--border)] shadow-xs ${className}`}
    >
      {/* 1. Rotating Conic Gradient Border Highlight Layer */}
      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 bento-border-animated ${
          isHovered ? 'opacity-100' : 'opacity-30'
        }`}
        style={{
          background: `conic-gradient(from var(--border-angle), transparent 20%, ${borderGlowRgba} 45%, ${accentColor} 50%, ${borderGlowRgba} 55%, transparent 80%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* 2. Cursor-tracking Radial Spotlight Glow */}
      {!isTouchDevice && isHovered && mousePos && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-150"
          style={{
            background: `radial-gradient(320px circle at var(--mx) var(--my), ${glowRgba}, transparent 75%)`,
          }}
        />
      )}

      {/* 3. Idle Breathing Ambient Corner Highlight (Staggered Delays) */}
      <div
        className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none transition-opacity ${breatheClass}`}
        style={{
          backgroundColor: accentColor,
          opacity: 0.18,
        }}
      />

      {/* 4. Active Hover Soft Elevation Shadow Overlay */}
      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200 ${
          isHovered ? 'opacity-100 shadow-lg' : 'opacity-0'
        }`}
        style={{
          boxShadow: `0 14px 40px -12px ${borderGlowRgba}`,
        }}
      />

      {/* 5. Surface Inner Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
