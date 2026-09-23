'use client';

import React, { useRef, useEffect } from 'react';
import type { AwakeningStage } from './useOpeningTimeline';
import { FlowFieldEngine, type PhotonSpark, type Vector2D } from './FlowField';
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

    // Astra-grade dense particle population: 300 desktop / 150 mobile
    const isMobile = width < 640;
    const count = isMobile ? 150 : 300;
    const photons: PhotonSpark[] = [];

    const PALETTE = [
      { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.75)' },  // Cyan
      { color: '#2563eb', glow: 'rgba(37, 99, 235, 0.70)' }, // Royal Blue
      { color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.70)' },// Violet
      { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.75)' }, // Sky
      { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.90)' },// Pure Light
    ];

    for (let i = 0; i < count; i++) {
      const z = (Math.random() * 2) - 1; // -1 (far) to +1 (near)
      const layerType: 'fine' | 'medium' | 'star' =
        i % 12 === 0 ? 'star' : i % 3 === 0 ? 'medium' : 'fine';

      const baseRadius =
        layerType === 'star' ? 2.2 + Math.random() * 0.9 :
        layerType === 'medium' ? 1.2 + Math.random() * 0.6 :
        0.5 + Math.random() * 0.4;

      const palette = PALETTE[i % PALETTE.length];

      // Initial orbital cluster
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * (Math.min(width, height) * 0.32);

      photons.push({
        id: i,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        z,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        baseRadius,
        layer: layerType,
        baseOpacity: layerType === 'star' ? 0.95 : layerType === 'medium' ? 0.7 : 0.4,
        color: palette.color,
        glowColor: palette.glow,
        targetNodeIndex: i % CRETIVRA_NODES.length,
        trail: [],
        maxTrailLength: layerType === 'star' ? 8 : layerType === 'medium' ? 5 : 2,
        phaseOffset: Math.random() * Math.PI * 2,
        settled: false,
      });
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      const currentStage = stageRef.current;
      const elapsed = elapsedRef.current;
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      // Clear canvas cleanly
      ctx.clearRect(0, 0, width, height);

      // 1. Scene 01 — THE VOID: Single Microscopic Point with Organic Heartbeat
      if (currentStage === 'SIGNAL') {
        const cx = width / 2;
        const cy = height / 2;
        const tNorm = Math.min(1, elapsed / 0.30);

        // Cardiac breathe rhythm: 0.4 -> 1.0 -> 0.7
        const breath = Math.sin(tNorm * Math.PI) * 0.6 + 0.4;
        const pointRadius = 0.9 + breath * 0.8;

        // Radiant multi-stop bloom
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32 * breath);
        bloom.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        bloom.addColorStop(0.3, 'rgba(6, 182, 212, 0.65)');
        bloom.addColorStop(0.65, 'rgba(139, 92, 246, 0.35)');
        bloom.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(cx, cy, 32 * breath, 0, Math.PI * 2);
        ctx.fill();

        // Hot white core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, pointRadius, 0, Math.PI * 2);
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

      // Calculate core bounds for target nodes
      const coreW = Math.min(width * 0.72, 350);
      const coreH = coreW * (480 / 736);
      const coreStartX = (width - coreW) / 2;
      const coreStartY = (height - coreH) / 2;

      // Master fade multiplier
      const globalAlpha =
        currentStage === 'TRANSITION'
          ? Math.max(0, 1 - (elapsed - 2.35) / 0.45)
          : currentStage === 'READY'
          ? 0
          : Math.min(1, (elapsed - 0.20) / 0.35);

      if (globalAlpha <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // 2. Enable Additive Blending (The secret to Astra luminous glow!)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      photons.forEach((p) => {
        const targetNode = CRETIVRA_NODES[p.targetNodeIndex];
        const targetPos: Vector2D = {
          x: coreStartX + targetNode.x * coreW,
          y: coreStartY + targetNode.y * coreH,
        };

        const forces = FlowFieldEngine.updatePhotonForces(
          p,
          {
            width,
            height,
            time: elapsed,
            stage: currentStage,
            pulseActive: pulseTriggeredRef.current,
            pulseTime: pulseTimeRef.current,
          },
          targetPos
        );

        p.vx += forces.x * dt * 55;
        p.vy += forces.y * dt * 55;

        // Friction damping
        const friction = currentStage === 'FORMATION' ? 0.89 : 0.94;
        p.vx *= friction;
        p.vy *= friction;

        p.x += p.vx;
        p.y += p.vy;

        // Depth perspective
        const depthScale = 0.65 + 0.35 * p.z;
        const radius = p.baseRadius * depthScale;
        const alpha = Math.max(0.08, p.baseOpacity * (0.6 + 0.4 * p.z)) * globalAlpha;

        // Record silky light trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > p.maxTrailLength) p.trail.shift();

        // Render silky ribbon trail
        if (p.trail.length > 2 && (Math.abs(p.vx) > 0.3 || Math.abs(p.vy) > 0.3)) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let k = 1; k < p.trail.length; k++) {
            ctx.lineTo(p.trail[k].x, p.trail[k].y);
          }
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = alpha * 0.38;
          ctx.lineWidth = radius * 0.8;
          ctx.stroke();
        }

        // Render Glowing Photon Spark
        ctx.globalAlpha = alpha;
        if (p.layer === 'star') {
          // Radiant star bloom
          const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.5);
          radGrad.addColorStop(0, '#ffffff');
          radGrad.addColorStop(0.35, p.color);
          radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

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
      className="absolute inset-0 pointer-events-none w-full h-full z-10"
      aria-hidden="true"
    />
  );
};
