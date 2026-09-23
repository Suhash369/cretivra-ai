'use client';

import React, { useRef, useEffect } from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { FlowFieldEngine, type VolumetricParticle, type Vector2D } from './FlowField';
import { CRETIVRA_NODES } from './EnergyParticles';

interface ParticleFieldProps {
  stage: AwakeningStage;
  elapsedTime: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({ stage, elapsedTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const elapsedRef = useRef(elapsedTime);
  elapsedRef.current = elapsedTime;

  const pulseTimeRef = useRef<number>(0);
  const pulseTriggeredRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight || 600);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);

    // Initialize 68 volumetric depth particles (desktop) or 36 (mobile)
    const isMobile = width < 640;
    const particleCount = isMobile ? 38 : 68;
    const particles: VolumetricParticle[] = [];

    const PALETTES = [
      { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)' },  // Cyan
      { color: '#2563eb', glow: 'rgba(37, 99, 235, 0.55)' }, // Royal Blue
      { color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.55)' },// Violet
      { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)' }, // Sky
      { color: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)' }, // Indigo
    ];

    for (let i = 0; i < particleCount; i++) {
      const z = (Math.random() * 2) - 1; // -1 (far) to +1 (near)
      const layerType: 'A' | 'B' | 'C' =
        i % 8 === 0 ? 'C' : i % 3 === 0 ? 'B' : 'A';

      const baseRadius =
        layerType === 'C' ? 2.2 + Math.random() * 0.8 :
        layerType === 'B' ? 1.3 + Math.random() * 0.7 :
        0.6 + Math.random() * 0.5;

      const palette = PALETTES[i % PALETTES.length];

      // Initial positions distributed around center with Gaussian-like clustering
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * (Math.min(width, height) * 0.35);

      particles.push({
        id: i,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        z,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: 0,
        baseRadius,
        layer: layerType,
        baseOpacity: layerType === 'C' ? 0.85 : layerType === 'B' ? 0.6 : 0.35,
        color: palette.color,
        glowColor: palette.glow,
        targetNodeIndex: i % CRETIVRA_NODES.length,
        hasTrail: layerType === 'C' || (layerType === 'B' && i % 2 === 0),
        trailHistory: [],
        settled: false,
      });
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      const currentStage = stageRef.current;
      const elapsed = elapsedRef.current;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // 1. Scene 01 — THE VOID (0.00 – 0.30s): Single microscopic luminous breathing point
      if (currentStage === 'SIGNAL') {
        const cx = width / 2;
        const cy = height / 2;
        const tNorm = Math.min(1, elapsed / 0.30);

        // Breathing curve: 0.4 -> 1.0 -> 0.7
        const breath = Math.sin(tNorm * Math.PI) * 0.6 + 0.4;
        const pointRadius = (0.9 + breath * 0.7);

        // Ultra-subtle atmospheric center bloom
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28 * breath);
        bloom.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
        bloom.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
        bloom.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(cx, cy, 28 * breath, 0, Math.PI * 2);
        ctx.fill();

        // Microscopic luminous point
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, pointRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Check consciousness pulse trigger
      if (currentStage === 'CONSCIOUS' && !pulseTriggeredRef.current) {
        pulseTriggeredRef.current = true;
        pulseTimeRef.current = 0;
      }
      if (pulseTriggeredRef.current) {
        pulseTimeRef.current += dt;
      }

      // Calculate core bounds for target node positions
      const coreW = Math.min(width * 0.72, 340);
      const coreH = coreW * (480 / 736);
      const coreStartX = (width - coreW) / 2;
      const coreStartY = (height - coreH) / 2;

      // Global stage opacity
      const globalAlpha =
        currentStage === 'TRANSITION'
          ? Math.max(0, 1 - (elapsed - 2.35) / 0.4)
          : currentStage === 'READY'
          ? 0
          : Math.min(1, (elapsed - 0.25) / 0.35);

      if (globalAlpha <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // 2. Update & Render Particles with 3D Depth
      particles.forEach((p) => {
        // Target node position in canvas space
        const targetNode = CRETIVRA_NODES[p.targetNodeIndex];
        const targetPos: Vector2D = {
          x: coreStartX + targetNode.x * coreW,
          y: coreStartY + targetNode.y * coreH,
        };

        // Compute vector forces from procedural flow field
        const forces = FlowFieldEngine.computeForces(
          p,
          {
            width,
            height,
            time: elapsed,
            pulseTriggered: pulseTriggeredRef.current,
            pulseTime: pulseTimeRef.current,
          },
          targetPos,
          currentStage
        );

        p.vx += forces.x * dt * 45;
        p.vy += forces.y * dt * 45;

        // Friction damping
        const friction = currentStage === 'FORMATION' ? 0.88 : 0.94;
        p.vx *= friction;
        p.vy *= friction;

        p.x += p.vx;
        p.y += p.vy;

        // Depth perspective scaling
        const depthScale = 0.65 + 0.35 * p.z; // closer = larger
        const renderRadius = p.baseRadius * depthScale;
        const renderOpacity = Math.max(0.08, p.baseOpacity * (0.55 + 0.45 * p.z)) * globalAlpha;

        // Draw motion trail for high-energy foreground particles
        if (p.hasTrail && (Math.abs(p.vx) > 0.4 || Math.abs(p.vy) > 0.4)) {
          p.trailHistory.push({ x: p.x, y: p.y, alpha: renderOpacity });
          if (p.trailHistory.length > 5) p.trailHistory.shift();

          ctx.save();
          for (let k = 0; k < p.trailHistory.length - 1; k++) {
            const pt1 = p.trailHistory[k];
            const pt2 = p.trailHistory[k + 1];
            const trailAlpha = (k / p.trailHistory.length) * renderOpacity * 0.45;
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = trailAlpha;
            ctx.lineWidth = renderRadius * 0.6;
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Render Particle Body
        ctx.save();
        ctx.globalAlpha = renderOpacity;
        if (p.z > 0.2) {
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.layer === 'C' ? 12 : 6;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, renderRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. Proximity Energy Threads between nearby particles (Layers B & C)
      if (currentStage === 'FIELD' || currentStage === 'FLOW' || currentStage === 'FORMATION') {
        ctx.save();
        const maxDist = currentStage === 'FORMATION' ? 62 : 44;
        for (let i = 0; i < particles.length; i += 2) {
          for (let j = i + 1; j < particles.length; j += 2) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.hypot(dx, dy);

            if (dist < maxDist) {
              const lineAlpha = (1 - dist / maxDist) * 0.28 * globalAlpha;
              ctx.strokeStyle = particles[i].color;
              ctx.globalAlpha = lineAlpha;
              ctx.lineWidth = 0.75;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

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
      className="absolute inset-0 pointer-events-none w-full h-full z-10"
      aria-hidden="true"
    />
  );
};
