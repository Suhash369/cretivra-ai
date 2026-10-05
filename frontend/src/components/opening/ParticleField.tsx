'use client';

import React, { useRef, useEffect } from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { FlowFieldEngine, type PhotonSpark, type Vector2D } from './FlowField';
import { CRETIVRA_NODES } from './EnergyParticles';

interface ParticleFieldProps {
  stage: AwakeningStage;
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

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap at 1.5 for ultra-high FPS on high-DPI displays
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

    // Pre-render glowing photon sprites once offscreen for 0-allocation GPU blitting
    const createGlowSprite = (coreColor: string, outerGlow: string, size: number = 32) => {
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return null;
      const half = size / 2;
      const grad = offCtx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, coreColor);
      grad.addColorStop(0.8, outerGlow);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(half, half, half, 0, Math.PI * 2);
      offCtx.fill();
      return offscreen;
    };

    const sprites: Record<string, HTMLCanvasElement | null> = {
      '#06b6d4': createGlowSprite('#06b6d4', 'rgba(6, 182, 212, 0.4)', 32),
      '#2563eb': createGlowSprite('#2563eb', 'rgba(37, 99, 235, 0.4)', 32),
      '#8b5cf6': createGlowSprite('#8b5cf6', 'rgba(139, 92, 246, 0.4)', 32),
      '#38bdf8': createGlowSprite('#38bdf8', 'rgba(56, 189, 248, 0.4)', 32),
      '#ffffff': createGlowSprite('#ffffff', 'rgba(6, 182, 212, 0.6)', 40),
    };

    // Refined, cinema-grade particle count for buttery 120 FPS
    const isMobile = width < 640;
    const count = isMobile ? 42 : 84;
    const photons: PhotonSpark[] = [];

    const PALETTE = [
      { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.75)' },
      { color: '#2563eb', glow: 'rgba(37, 99, 235, 0.70)' },
      { color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.70)' },
      { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.75)' },
      { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.90)' },
    ];

    for (let i = 0; i < count; i++) {
      const z = Math.random() * 2 - 1;
      const layerType: 'fine' | 'medium' | 'star' =
        i % 8 === 0 ? 'star' : i % 3 === 0 ? 'medium' : 'fine';

      const baseRadius =
        layerType === 'star' ? 2.0 + Math.random() * 0.6 :
        layerType === 'medium' ? 1.2 + Math.random() * 0.4 :
        0.7 + Math.random() * 0.3;

      const palette = PALETTE[i % PALETTE.length];
      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * (Math.min(width, height) * 0.30);
      const startX = width / 2 + Math.cos(angle) * radius;
      const startY = height / 2 + Math.sin(angle) * radius;

      photons.push({
        id: i,
        x: startX,
        y: startY,
        px: startX,
        py: startY,
        z,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseRadius,
        layer: layerType,
        baseOpacity: layerType === 'star' ? 0.95 : layerType === 'medium' ? 0.75 : 0.5,
        color: palette.color,
        glowColor: palette.glow,
        targetNodeIndex: i % CRETIVRA_NODES.length,
        trail: [],
        maxTrailLength: 2,
        phaseOffset: Math.random() * Math.PI * 2,
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

      // Clean canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Scene 01 — THE VOID: Clean, luminous breathing signal dot
      if (currentStage === 'SIGNAL') {
        const cx = width / 2;
        const cy = height / 2;
        const tNorm = Math.min(1, elapsed / 0.60);
        const breath = Math.sin(tNorm * Math.PI) * 0.5 + 0.5;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const starSprite = sprites['#ffffff'] || sprites['#06b6d4'];
        if (starSprite) {
          const bloomSize = 56 * breath;
          ctx.drawImage(starSprite, cx - bloomSize / 2, cy - bloomSize / 2, bloomSize, bloomSize);
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.4 + breath * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (currentStage === 'CONSCIOUS' && !pulseTriggeredRef.current) {
        pulseTriggeredRef.current = true;
        pulseTimeRef.current = 0;
      }
      if (pulseTriggeredRef.current) {
        pulseTimeRef.current += dt;
      }

      const coreW = Math.min(width * 0.72, 350);
      const coreH = coreW * (480 / 736);
      const coreStartX = (width - coreW) / 2;
      const coreStartY = (height - coreH) / 2;

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

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const forcesParams = {
        width,
        height,
        time: elapsed,
        stage: currentStage,
        pulseActive: pulseTriggeredRef.current,
        pulseTime: pulseTimeRef.current,
      };

      for (let i = 0; i < photons.length; i++) {
        const p = photons[i];
        const targetNode = CRETIVRA_NODES[p.targetNodeIndex];
        const targetPos: Vector2D = {
          x: coreStartX + targetNode.x * coreW,
          y: coreStartY + targetNode.y * coreH,
        };

        const forces = FlowFieldEngine.updatePhotonForces(p, forcesParams, targetPos);

        p.vx += forces.x * dt * 45;
        p.vy += forces.y * dt * 45;

        const friction = currentStage === 'FORMATION' ? 0.91 : 0.94;
        p.vx *= friction;
        p.vy *= friction;

        p.px = p.x;
        p.py = p.y;
        p.x += p.vx;
        p.y += p.vy;

        const depthScale = 0.7 + 0.3 * p.z;
        const radius = p.baseRadius * depthScale;
        const alpha = Math.max(0.1, p.baseOpacity * (0.65 + 0.35 * p.z)) * globalAlpha;

        ctx.globalAlpha = alpha;

        // Zero-allocation silky light streak
        const speedSq = p.vx * p.vx + p.vy * p.vy;
        if (speedSq > 0.08 && p.px !== undefined && p.py !== undefined) {
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = radius * 0.9;
          ctx.stroke();
        }

        // Render Glowing Photon Spark via pre-rendered hardware sprites
        if (p.layer === 'star') {
          const sprite = sprites[p.color] || sprites['#06b6d4'];
          if (sprite) {
            const spriteSize = radius * 7.5;
            ctx.drawImage(
              sprite,
              p.x - spriteSize / 2,
              p.y - spriteSize / 2,
              spriteSize,
              spriteSize
            );
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
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
