/**
 * FlowField.ts - Procedural Vector Physics & Fluid Gravitational Wells
 * Astra-level kinetic simulation for ASURA AI Intelligence Awakening.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface PhotonSpark {
  id: number;
  x: number;
  y: number;
  z: number;              // -1 (deep background) to +1 (foreground)
  vx: number;
  vy: number;
  baseRadius: number;
  layer: 'fine' | 'medium' | 'star';
  baseOpacity: number;
  color: string;
  glowColor: string;
  targetNodeIndex: number;
  trail: { x: number; y: number }[];
  maxTrailLength: number;
  phaseOffset: number;
  settled: boolean;
}

// Procedural curl-noise approximation for silky fluid streams
export function curlNoise(x: number, y: number, time: number): Vector2D {
  const eps = 1.0;
  const n1 = Math.sin(x * 0.008 + time * 1.4) + Math.cos(y * 0.008 - time * 1.1);
  const n2 = Math.sin((x + eps) * 0.008 + time * 1.4) + Math.cos(y * 0.008 - time * 1.1);
  const n3 = Math.sin(x * 0.008 + time * 1.4) + Math.cos((y + eps) * 0.008 - time * 1.1);

  const dy = (n3 - n1) / eps;
  const dx = (n2 - n1) / eps;
  // Perpendicular gradient produces non-divergent fluid curl
  return { x: dy * 1.8, y: -dx * 1.8 };
}

export interface FlowEngineParams {
  width: number;
  height: number;
  time: number;
  stage: string;
  pulseActive: boolean;
  pulseTime: number; // time in seconds since pulse trigger
}

export class FlowFieldEngine {
  static updatePhotonForces(
    p: PhotonSpark,
    params: FlowEngineParams,
    targetPos?: Vector2D
  ): Vector2D {
    const { width, height, time, stage, pulseActive, pulseTime } = params;
    const cx = width / 2;
    const cy = height / 2;

    let fx = 0;
    let fy = 0;

    // 1. Fluid curl noise field
    const curl = curlNoise(p.x, p.y, time);
    const noiseScale = stage === 'STABILIZE' ? 0.04 : 0.22;
    fx += curl.x * noiseScale;
    fy += curl.y * noiseScale;

    // Twin gravitational well coordinates (left loop: cyan/blue, right loop: violet/cyan)
    const wellDistX = Math.min(width * 0.16, 120);
    const isLeft = p.x < cx;
    const wellX = isLeft ? cx - wellDistX : cx + wellDistX;
    const wellY = cy;

    if (stage === 'FIELD' || stage === 'FLOW') {
      // 2. Gravitational well orbital circulation
      const dx = p.x - wellX;
      const dy = p.y - wellY;
      const dist = Math.hypot(dx, dy) || 1;

      // Desired orbital radius
      const targetRadius = Math.min(width, height) * 0.16;
      const radiusDelta = dist - targetRadius;
      const attract = -radiusDelta * 0.0012;

      fx += (dx / dist) * attract;
      fy += (dy / dist) * attract;

      // Silky tangential swirl (Left well clockwise, Right well counter-clockwise)
      const orbitDir = isLeft ? 1 : -1;
      const speed = 0.85 * (0.8 + 0.4 * p.z);
      fx += (-dy / dist) * speed * orbitDir;
      fy += (dx / dist) * speed * orbitDir;

      // Infinity cross-over bridge force near center saddle
      const distToCenter = Math.hypot(p.x - cx, p.y - cy);
      if (distToCenter < 70) {
        fx += (isLeft ? 0.75 : -0.75);
      }
    }

    if (stage === 'FORMATION' && targetPos) {
      // 3. Magnetic target attraction toward 11 CRETIVRA nodes with natural spring overshoot
      const dx = targetPos.x - p.x;
      const dy = targetPos.y - p.y;
      const dist = Math.hypot(dx, dy);

      const spring = 0.085;
      fx += dx * spring;
      fy += dy * spring;

      if (dist < 3) {
        p.settled = true;
      }
    }

    if (stage === 'STABILIZE') {
      // 4. Stillness deceleration (300ms quiet breath)
      fx *= 0.06;
      fy *= 0.06;
      p.vx *= 0.65;
      p.vy *= 0.65;
    }

    if (pulseActive && pulseTime < 0.95) {
      // 5. Visceral double-heartbeat shockwave outward blast
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.hypot(dx, dy) || 1;

      // Two pulse wavefronts (double heartbeat)
      const wave1Dist = pulseTime * 480;
      const wave2Dist = Math.max(0, (pulseTime - 0.16) * 520);

      const diff1 = Math.abs(dist - wave1Dist);
      const diff2 = Math.abs(dist - wave2Dist);

      if (diff1 < 55) {
        const blast1 = (1 - diff1 / 55) * (1 - pulseTime / 0.95) * 5.5;
        fx += (dx / dist) * blast1;
        fy += (dy / dist) * blast1;
      }

      if (diff2 < 50 && pulseTime > 0.16) {
        const blast2 = (1 - diff2 / 50) * (1 - pulseTime / 0.95) * 4.6;
        fx += (dx / dist) * blast2;
        fy += (dy / dist) * blast2;
      }
    }

    return { x: fx, y: fy };
  }
}
