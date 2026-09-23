import React, { useRef, useEffect } from 'react';

export type ParticleStage = 'signal' | 'awakening' | 'converging' | 'dormant';

interface EnergyParticlesProps {
  stage: ParticleStage;
  width?: number;
  height?: number;
}

interface Particle {
  id: number;
  t: number;             // parametric position along the curve
  speed: number;         // speed along curve
  lobeDir: 1 | -1;       // 1 for clockwise, -1 for counter-clockwise
  radius: number;        // particle radius
  baseOpacity: number;
  color: string;
  glowColor: string;
  targetNodeIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// 11 primary node positions mapped to relative [0..1] coordinates within the logo core box
export const CRETIVRA_NODES: { x: number; y: number; color: string }[] = [
  { x: 0.500, y: 0.500, color: '#298fd7' }, // Center crossing node
  { x: 0.272, y: 0.100, color: '#227eef' }, // Left top
  { x: 0.272, y: 0.900, color: '#226ff1' }, // Left bottom
  { x: 0.052, y: 0.308, color: '#206cf3' }, // Left top-outer
  { x: 0.052, y: 0.692, color: '#1f6bf2' }, // Left bottom-outer
  { x: 0.034, y: 0.500, color: '#1e6bf7' }, // Left outer-edge
  { x: 0.728, y: 0.100, color: '#1ac2dc' }, // Right top
  { x: 0.728, y: 0.900, color: '#20addb' }, // Right bottom
  { x: 0.948, y: 0.308, color: '#1ac9de' }, // Right top-outer
  { x: 0.948, y: 0.692, color: '#18c0db' }, // Right bottom-outer
  { x: 0.965, y: 0.500, color: '#17c3d9' }, // Right outer-edge
];

const BRAND_PALETTE = [
  { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)' },  // Cyan
  { color: '#2563eb', glow: 'rgba(37, 99, 235, 0.55)' }, // Royal Blue
  { color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.6)' }, // Violet
  { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' }, // Sky
  { color: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)' }, // Indigo
];

export const EnergyParticles: React.FC<EnergyParticlesProps> = ({ stage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<ParticleStage>(stage);
  stageRef.current = stage;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 420);

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

    // Core dimensions within canvas
    const getCoreBounds = () => {
      const coreW = Math.min(width * 0.72, 380);
      const coreH = coreW * (480 / 736);
      const startX = (width - coreW) / 2;
      const startY = (height - coreH) / 2;
      return { startX, startY, coreW, coreH, cx: width / 2, cy: height / 2 };
    };

    // Initialize 32 organic orbital particles
    const particleCount = 34;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const palette = BRAND_PALETTE[i % BRAND_PALETTE.length];
      particles.push({
        id: i,
        t: (i / particleCount) * Math.PI * 2,
        speed: 0.018 + (i % 5) * 0.004,
        lobeDir: i % 2 === 0 ? 1 : -1,
        radius: 1.8 + (i % 4) * 0.7,
        baseOpacity: 0.5 + (i % 4) * 0.15,
        color: palette.color,
        glowColor: palette.glow,
        targetNodeIndex: i % CRETIVRA_NODES.length,
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
      });
    }

    let signalPulse = 0;
    let globalAlpha = 1;

    const render = () => {
      const currentStage = stageRef.current;
      if (currentStage === 'dormant') {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const { startX, startY, coreW, coreH, cx, cy } = getCoreBounds();

      if (currentStage === 'signal') {
        signalPulse += 0.08;
        const pulseScale = 1 + Math.sin(signalPulse) * 0.12;

        // Soft outer ambient bloom
        const bloomGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38 * pulseScale);
        bloomGrad.addColorStop(0, 'rgba(6, 182, 212, 0.7)');
        bloomGrad.addColorStop(0.4, 'rgba(139, 92, 246, 0.35)');
        bloomGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = bloomGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 38 * pulseScale, 0, Math.PI * 2);
        ctx.fill();

        // Dense inner core
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5 * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Awakening & Converging Stages
      const a = coreW * 0.42; // lemniscate scale
      const b = coreH * 0.44;

      particles.forEach((p) => {
        p.t += p.speed * p.lobeDir;

        // Parametric Lemniscate of Bernoulli: x = a*cos(t)/(1+sin(t)^2), y = b*sin(t)*cos(t)/(1+sin(t)^2)
        const denom = 1 + Math.sin(p.t) * Math.sin(p.t);
        const targetLemX = cx + (a * Math.cos(p.t)) / denom;
        const targetLemY = cy + (b * Math.sin(p.t) * Math.cos(p.t)) / denom;

        if (currentStage === 'awakening') {
          // Flow along lemniscate curve
          p.x += (targetLemX - p.x) * 0.12;
          p.y += (targetLemY - p.y) * 0.12;
        } else if (currentStage === 'converging') {
          // Attract towards the exact 11 CRETIVRA logo nodes
          const node = CRETIVRA_NODES[p.targetNodeIndex];
          const nodeAbsX = startX + node.x * coreW;
          const nodeAbsY = startY + node.y * coreH;
          p.x += (nodeAbsX - p.x) * 0.16;
          p.y += (nodeAbsY - p.y) * 0.16;
        }

        // Render particle with subtle luminous glow
        ctx.save();
        ctx.globalAlpha = p.baseOpacity * globalAlpha;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Thin energy trails connecting nearby particles
      ctx.save();
      ctx.lineWidth = 0.85;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = currentStage === 'converging' ? 70 : 48;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.35 * globalAlpha;
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
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
      className="absolute inset-0 pointer-events-none w-full h-full z-10"
      aria-hidden="true"
    />
  );
};
