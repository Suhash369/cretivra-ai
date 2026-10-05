'use client';

import React, { useRef, useEffect } from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { CRETIVRA_NODES } from './EnergyParticles';

interface ParticleFieldProps {
  stage: AwakeningStage;
}

type ParticleType = 'stream_primary' | 'stream_secondary' | 'ring_left' | 'ring_right' | 'node_beacon';

interface StructuredParticle {
  id: number;
  type: ParticleType;
  t: number;               // Parametric progress [0..2PI]
  speed: number;           // Angular or progression speed
  radius: number;          // Base radius
  color: string;
  glowColor: string;
  targetNodeIndex?: number; // For node_beacon
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  settled?: boolean;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({ stage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  const pulseTimeRef = useRef<number>(0);
  const pulseTriggeredRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight || 600);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);

    // Detect theme for optimal contrast & blend modes
    const isDark =
      typeof document !== 'undefined' &&
      (document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Pre-render glowing photon sprites once offscreen for 0-allocation GPU rendering
    const createGlowSprite = (coreColor: string, outerGlow: string, size: number = 36) => {
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return null;
      const half = size / 2;
      const grad = offCtx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, coreColor);
      grad.addColorStop(0.75, outerGlow);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(half, half, half, 0, Math.PI * 2);
      offCtx.fill();
      return offscreen;
    };

    // Theme-tailored palettes (High contrast in Light mode, Electric neon in Dark mode)
    const PALETTE = isDark
      ? {
          cyan: '#06b6d4',
          cyanGlow: 'rgba(6, 182, 212, 0.65)',
          blue: '#2563eb',
          blueGlow: 'rgba(37, 99, 235, 0.60)',
          violet: '#8b5cf6',
          violetGlow: 'rgba(139, 92, 246, 0.65)',
          sky: '#38bdf8',
          skyGlow: 'rgba(56, 189, 248, 0.70)',
          white: '#ffffff',
          whiteGlow: 'rgba(6, 182, 212, 0.85)',
        }
      : {
          cyan: '#0891b2',
          cyanGlow: 'rgba(8, 145, 178, 0.55)',
          blue: '#1d4ed8',
          blueGlow: 'rgba(29, 78, 216, 0.50)',
          violet: '#7c3aed',
          violetGlow: 'rgba(124, 58, 237, 0.55)',
          sky: '#0284c7',
          skyGlow: 'rgba(2, 132, 199, 0.60)',
          white: '#ffffff',
          whiteGlow: 'rgba(2, 132, 199, 0.75)',
        };

    const sprites: Record<string, HTMLCanvasElement | null> = {
      cyan: createGlowSprite(PALETTE.cyan, PALETTE.cyanGlow, 36),
      blue: createGlowSprite(PALETTE.blue, PALETTE.blueGlow, 36),
      violet: createGlowSprite(PALETTE.violet, PALETTE.violetGlow, 36),
      sky: createGlowSprite(PALETTE.sky, PALETTE.skyGlow, 36),
      white: createGlowSprite(PALETTE.white, PALETTE.whiteGlow, 44),
    };

    // Calculate exact mathematical dimensions identical to LogoCore DOM element
    const isMobile = width < 640;
    const coreW = isMobile ? 280 : 350;
    const coreH = coreW * (480 / 736);
    const cx = width / 2;
    const cy = height / 2;
    const coreStartX = (width - coreW) / 2;
    const coreStartY = (height - coreH) / 2;

    // Mathematical parameters for the Lemniscate of Gerono (Infinity Ribbon)
    const scaleX = coreW * 0.40;
    const scaleY = coreH * 1.00;

    // Centers and radii for the left and right outer geodesic circles
    const cxL = coreStartX + 0.272 * coreW;
    const cxR = coreStartX + 0.728 * coreW;
    const ringRadius = coreH * 0.400;

    // Helper: evaluate exact Lemniscate coordinate
    const getLemniscatePoint = (t: number, exp: number = 1.0) => {
      const sinT = Math.sin(t);
      const cosT = Math.cos(t);
      const denom = 1 + sinT * sinT;
      return {
        x: cx + ((scaleX * cosT) / denom) * exp,
        y: cy + ((scaleY * sinT * cosT) / denom) * exp,
      };
    };

    // Helper: evaluate circle coordinate
    const getCirclePoint = (centerCircleX: number, t: number, r: number, exp: number = 1.0) => {
      return {
        x: centerCircleX + Math.cos(t) * r * exp,
        y: cy + Math.sin(t) * r * exp,
      };
    };

    // Initialize Structured Particle Constellation: 71 total particles
    const particles: StructuredParticle[] = [];
    let pId = 0;

    // 1. Infinity Ribbon Stream 1 (Forward flow: Cyan / Sky / White) - 20 particles
    const STREAM_COUNT = 20;
    for (let i = 0; i < STREAM_COUNT; i++) {
      const t = (i / STREAM_COUNT) * Math.PI * 2;
      const initialPos = getLemniscatePoint(t, 0.1);
      particles.push({
        id: pId++,
        type: 'stream_primary',
        t,
        speed: 0.95 + (i % 3) * 0.15,
        radius: i % 4 === 0 ? 2.4 : 1.5,
        color: i % 4 === 0 ? PALETTE.white : i % 2 === 0 ? PALETTE.cyan : PALETTE.sky,
        glowColor: PALETTE.cyanGlow,
        x: initialPos.x,
        y: initialPos.y,
        px: initialPos.x,
        py: initialPos.y,
        vx: 0,
        vy: 0,
      });
    }

    // 2. Infinity Ribbon Stream 2 (Counter-phase flow: Violet / Blue / Cyan) - 20 particles
    for (let i = 0; i < STREAM_COUNT; i++) {
      const t = (i / STREAM_COUNT) * Math.PI * 2 + Math.PI; // 180deg phase offset
      const initialPos = getLemniscatePoint(t, 0.1);
      particles.push({
        id: pId++,
        type: 'stream_secondary',
        t,
        speed: 0.90 + (i % 3) * 0.12,
        radius: i % 4 === 0 ? 2.3 : 1.4,
        color: i % 3 === 0 ? PALETTE.violet : i % 2 === 0 ? PALETTE.blue : PALETTE.cyan,
        glowColor: PALETTE.violetGlow,
        x: initialPos.x,
        y: initialPos.y,
        px: initialPos.x,
        py: initialPos.y,
        vx: 0,
        vy: 0,
      });
    }

    // 3. Left Outer Geodesic Ring Constellation - 10 particles (Clockwise)
    const RING_COUNT = 10;
    for (let i = 0; i < RING_COUNT; i++) {
      const t = (i / RING_COUNT) * Math.PI * 2;
      const initialPos = getCirclePoint(cxL, t, ringRadius, 0.1);
      particles.push({
        id: pId++,
        type: 'ring_left',
        t,
        speed: 0.85 + (i % 2) * 0.1,
        radius: i % 3 === 0 ? 2.2 : 1.3,
        color: i % 2 === 0 ? PALETTE.blue : PALETTE.cyan,
        glowColor: PALETTE.blueGlow,
        x: initialPos.x,
        y: initialPos.y,
        px: initialPos.x,
        py: initialPos.y,
        vx: 0,
        vy: 0,
      });
    }

    // 4. Right Outer Geodesic Ring Constellation - 10 particles (Counter-Clockwise)
    for (let i = 0; i < RING_COUNT; i++) {
      const t = (i / RING_COUNT) * Math.PI * 2;
      const initialPos = getCirclePoint(cxR, t, ringRadius, 0.1);
      particles.push({
        id: pId++,
        type: 'ring_right',
        t,
        speed: -0.85 - (i % 2) * 0.1,
        radius: i % 3 === 0 ? 2.2 : 1.3,
        color: i % 2 === 0 ? PALETTE.cyan : PALETTE.violet,
        glowColor: PALETTE.cyanGlow,
        x: initialPos.x,
        y: initialPos.y,
        px: initialPos.x,
        py: initialPos.y,
        vx: 0,
        vy: 0,
      });
    }

    // 5. Node Beacon Anchors - Exactly 11 particles (1 per exact CRETIVRA node)
    for (let i = 0; i < CRETIVRA_NODES.length; i++) {
      const node = CRETIVRA_NODES[i];
      const targetX = coreStartX + node.x * coreW;
      const targetY = coreStartY + node.y * coreH;
      const isCenter = i === 0;

      particles.push({
        id: pId++,
        type: 'node_beacon',
        t: 0,
        speed: 0,
        targetNodeIndex: i,
        radius: isCenter ? 3.0 : 2.2,
        color: isCenter ? PALETTE.white : node.color,
        glowColor: isCenter ? PALETTE.whiteGlow : PALETTE.cyanGlow,
        x: cx,
        y: cy,
        px: cx,
        py: cy,
        vx: 0,
        vy: 0,
        settled: false,
      });
    }

    const startPerfTime = performance.now();
    let lastTime = startPerfTime;

    const render = (now: number) => {
      const currentStage = stageRef.current;
      const elapsed = (now - startPerfTime) / 1000;
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // Clear canvas cleanly
      ctx.clearRect(0, 0, width, height);

      // 1. Stage 01: SIGNAL (0.00 – 0.60s) — Single Radiant Center Point
      if (currentStage === 'SIGNAL') {
        const tNorm = Math.min(1, elapsed / 0.60);
        const breath = Math.sin(tNorm * Math.PI) * 0.5 + 0.5;

        ctx.save();
        ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

        const starSprite = sprites.white || sprites.cyan;
        if (starSprite) {
          const bloomSize = 54 * (0.6 + 0.4 * breath);
          ctx.drawImage(starSprite, cx - bloomSize / 2, cy - bloomSize / 2, bloomSize, bloomSize);
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.8 + breath * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Track consciousness pulse
      if (currentStage === 'CONSCIOUS' && !pulseTriggeredRef.current) {
        pulseTriggeredRef.current = true;
        pulseTimeRef.current = 0;
      }
      if (pulseTriggeredRef.current) {
        pulseTimeRef.current += dt;
      }

      // Master fade multiplier
      const globalAlpha =
        currentStage === 'TRANSITION'
          ? Math.max(0, 1 - (elapsed - 4.70) / 0.50)
          : currentStage === 'READY'
          ? 0
          : Math.min(1, (elapsed - 0.40) / 0.45);

      if (globalAlpha <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Expansion factor: expands smoothly from 0.1 to 1.0 during FIELD (0.60 – 1.40s)
      const fieldProgress = Math.min(1, Math.max(0, (elapsed - 0.60) / 0.80));
      const expansion =
        currentStage === 'FIELD'
          ? 0.15 + 0.85 * (1 - Math.pow(1 - fieldProgress, 3)) // Cubic ease-out
          : 1.0;

      ctx.save();
      // On light theme, source-over preserves crystal contrast; on dark theme, lighter creates neon blooms
      ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.px = p.x;
        p.py = p.y;

        // --- Kinematics based on structured particle role ---
        if (p.type === 'stream_primary' || p.type === 'stream_secondary') {
          // Advance parameter along the lemniscate
          p.t = (p.t + p.speed * dt * (currentStage === 'FORMATION' ? 0.75 : 1.0)) % (Math.PI * 2);
          const target = getLemniscatePoint(p.t, expansion);

          // Smooth interpolation towards mathematical trajectory
          const lerpSpeed = currentStage === 'FORMATION' ? 0.22 : 0.35;
          p.x += (target.x - p.x) * lerpSpeed;
          p.y += (target.y - p.y) * lerpSpeed;

        } else if (p.type === 'ring_left') {
          p.t = (p.t + p.speed * dt) % (Math.PI * 2);
          const target = getCirclePoint(cxL, p.t, ringRadius, expansion);
          p.x += (target.x - p.x) * 0.30;
          p.y += (target.y - p.y) * 0.30;

        } else if (p.type === 'ring_right') {
          p.t = (p.t + p.speed * dt) % (Math.PI * 2);
          const target = getCirclePoint(cxR, p.t, ringRadius, expansion);
          p.x += (target.x - p.x) * 0.30;
          p.y += (target.y - p.y) * 0.30;

        } else if (p.type === 'node_beacon') {
          const node = CRETIVRA_NODES[p.targetNodeIndex || 0];
          const destX = coreStartX + node.x * coreW;
          const destY = coreStartY + node.y * coreH;

          if (currentStage === 'FIELD' || currentStage === 'FLOW') {
            // Gentle hovering orbit around node origin
            const hoverRadius = 6 * (1 - expansion * 0.5);
            const angle = elapsed * 2.2 + (p.targetNodeIndex || 0);
            const targetX = cx + (destX - cx) * expansion + Math.cos(angle) * hoverRadius;
            const targetY = cy + (destY - cy) * expansion + Math.sin(angle) * hoverRadius;
            p.x += (targetX - p.x) * 0.20;
            p.y += (targetY - p.y) * 0.20;
          } else {
            // Magnetic locking directly onto exact node coordinates
            const spring = 0.18;
            p.vx = (p.vx + (destX - p.x) * spring) * 0.78;
            p.vy = (p.vy + (destY - p.y) * spring) * 0.78;
            p.x += p.vx;
            p.y += p.vy;
            if (Math.hypot(destX - p.x, destY - p.y) < 1.2) {
              p.x = destX;
              p.y = destY;
              p.settled = true;
            }
          }
        }

        // Heartbeat pulse shockwave reaction
        if (pulseTriggeredRef.current && pulseTimeRef.current < 0.8) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.hypot(dx, dy) || 1;
          const waveDist = pulseTimeRef.current * 420;
          const diff = Math.abs(dist - waveDist);
          if (diff < 45) {
            const push = (1 - diff / 45) * (1 - pulseTimeRef.current / 0.8) * 1.8;
            p.x += (dx / dist) * push;
            p.y += (dy / dist) * push;
          }
        }

        // --- Render silky kinetic light streak ---
        const distSq = (p.x - p.px) * (p.x - p.px) + (p.y - p.py) * (p.y - p.py);
        if (distSq > 0.05 && distSq < 900) {
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.radius * (isDark ? 0.95 : 1.15);
          ctx.globalAlpha = (isDark ? 0.45 : 0.65) * globalAlpha;
          ctx.stroke();
        }

        // --- Render luminous photon spark ---
        ctx.globalAlpha = (p.type === 'node_beacon' ? 0.95 : 0.85) * globalAlpha;

        if (p.radius > 2.0) {
          // Large star flare via cached sprite
          const spriteKey =
            p.color === PALETTE.white ? 'white' :
            p.color === PALETTE.violet ? 'violet' :
            p.color === PALETTE.blue ? 'blue' : 'cyan';
          const sprite = sprites[spriteKey] || sprites.cyan;
          if (sprite) {
            const size = p.radius * (isDark ? 7.2 : 5.8);
            ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
          }
        }

        // Core solid photon dot
        ctx.fillStyle = isDark && p.radius > 2.0 ? '#ffffff' : p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (isDark ? 0.85 : 1.0), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full z-10 will-change-transform transform-gpu"
      style={{ transform: 'translateZ(0)' }}
      aria-hidden="true"
    />
  );
};
