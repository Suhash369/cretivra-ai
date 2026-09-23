/**
 * FlowField.ts - Procedural Vector Physics & Gravitational Wells
 * Calculates continuous forces for the Asura Intelligence Awakening.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface VolumetricParticle {
  id: number;
  x: number;
  y: number;
  z: number;              // -1 (deep background) to +1 (foreground)
  vx: number;
  vy: number;
  vz: number;
  baseRadius: number;
  layer: 'A' | 'B' | 'C'; // A: 0.5-1px, B: 1-2px, C: 2-3px rare bright
  baseOpacity: number;
  color: string;
  glowColor: string;
  targetNodeIndex: number;
  hasTrail: boolean;
  trailHistory: { x: number; y: number; alpha: number }[];
  settled: boolean;
}

// Simple pseudo-noise function for deterministic organic motion
export function pseudoNoise(x: number, y: number, time: number): number {
  const sin1 = Math.sin(x * 0.015 + time * 1.2);
  const cos1 = Math.cos(y * 0.015 - time * 0.8);
  const sin2 = Math.sin((x + y) * 0.008 + time * 0.6);
  return (sin1 + cos1 + sin2) / 3;
}

export interface FlowFieldParams {
  width: number;
  height: number;
  time: number;
  pulseTriggered: boolean;
  pulseTime: number; // time since pulse
}

export class FlowFieldEngine {
  // Gravitational wells forming subconscious infinity
  static computeForces(
    p: VolumetricParticle,
    params: FlowFieldParams,
    targetNodePos?: Vector2D,
    stage?: string
  ): Vector2D {
    const { width, height, time, pulseTriggered, pulseTime } = params;
    const cx = width / 2;
    const cy = height / 2;

    // Twin gravitational well centers matching the twin infinity lobes
    const wellDistX = width * 0.16;
    const leftWell: Vector2D = { x: cx - wellDistX, y: cy };
    const rightWell: Vector2D = { x: cx + wellDistX, y: cy };

    let fx = 0;
    let fy = 0;

    // 1. Organic noise force
    const noiseAngle = pseudoNoise(p.x, p.y, time) * Math.PI * 2;
    const noiseMag = stage === 'STABILIZE' ? 0.02 : 0.14;
    fx += Math.cos(noiseAngle) * noiseMag;
    fy += Math.sin(noiseAngle) * noiseMag;

    if (stage === 'FIELD' || stage === 'FLOW') {
      // 2. Gravitational well orbital forces
      // Assign particle to left or right well based on position or id
      const well = p.x < cx ? leftWell : rightWell;
      const dx = p.x - well.x;
      const dy = p.y - well.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Centripetal attraction force toward well
      const idealOrbitRadius = Math.min(width, height) * 0.18;
      const distDiff = dist - idealOrbitRadius;
      const attractMag = -distDiff * 0.0008;
      fx += (dx / dist) * attractMag;
      fy += (dy / dist) * attractMag;

      // Tangential orbital velocity (clockwise for left, counter-clockwise for right)
      const orbitDir = p.x < cx ? 1 : -1;
      const orbitSpeed = 0.55 * (0.8 + 0.4 * p.z);
      fx += (-dy / dist) * orbitSpeed * orbitDir;
      fy += (dx / dist) * orbitSpeed * orbitDir;

      // Figure-eight crossover bridge force near center saddle
      const centerDist = Math.hypot(p.x - cx, p.y - cy);
      if (centerDist < width * 0.12) {
        // Accelerate through center to transition across lobes
        fx += (p.x < cx ? 0.4 : -0.4);
      }
    }

    if (stage === 'FORMATION' && targetNodePos) {
      // 3. Target attraction with smooth inertia & slight overshoot
      const dx = targetNodePos.x - p.x;
      const dy = targetNodePos.y - p.y;
      const dist = Math.hypot(dx, dy);

      const spring = 0.065;
      fx += dx * spring;
      fy += dy * spring;

      // Damping velocity near target
      if (dist < 4) {
        p.settled = true;
      }
    }

    if (stage === 'STABILIZE') {
      // 4. Stillness damping (100-150ms pause before heartbeat)
      fx *= 0.15;
      fy *= 0.15;
      p.vx *= 0.75;
      p.vy *= 0.75;
    }

    if (pulseTriggered && pulseTime < 0.6) {
      // 5. Consciousness Heartbeat pulse wave displacing particles outward
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const pulseSpeed = 480; // px/sec
      const waveDist = pulseTime * pulseSpeed;
      const waveDiff = Math.abs(dist - waveDist);

      if (waveDiff < 45) {
        const blastFactor = (1 - waveDiff / 45) * (1 - pulseTime / 0.6) * 3.8;
        fx += (dx / dist) * blastFactor;
        fy += (dy / dist) * blastFactor;
      }
    }

    return { x: fx, y: fy };
  }
}
