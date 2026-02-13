export interface GradientPoint {
  position: number;
  opacity: number;
  density: number;
}

export interface GradientOptions {
  angle: number;
  points: GradientPoint[];
}

export interface GradientMask {
  opacity: number;
  density: number;
}

function cubicInterpolate(y0: number, y1: number, y2: number, y3: number, mu: number): number {
  const mu2 = mu * mu;
  const mu3 = mu2 * mu;
  const a0 = y3 - y2 - y0 + y1;
  const a1 = y0 - y1 - a0;
  const a2 = y2 - y0;
  const a3 = y1;
  return a0 * mu3 + a1 * mu2 + a2 * mu + a3;
}

function noise(x: number, y: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return (value - Math.floor(value)) * 0.015;
}

export function calculateGradientMask(
  x: number,
  y: number,
  width: number,
  height: number,
  options: GradientOptions
): GradientMask {
  const { angle, points } = options;
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const normalizedX = x / width - 0.5;
  const normalizedY = y / height - 0.5;
  let position = (normalizedX * cos + normalizedY * sin + 0.5) * 100;
  position += noise(x, y) * 100;

  const sortedPoints = [...points].sort((a, b) => a.position - b.position);
  let i = 1;
  while (i < sortedPoints.length - 1 && sortedPoints[i].position < position) i++;

  const p0 = sortedPoints[Math.max(0, i - 2)];
  const p1 = sortedPoints[Math.max(0, i - 1)];
  const p2 = sortedPoints[Math.min(sortedPoints.length - 1, i)];
  const p3 = sortedPoints[Math.min(sortedPoints.length - 1, i + 1)];
  const range = p2.position - p1.position;
  const mu = range === 0 ? 0 : Math.max(0, Math.min(1, (position - p1.position) / range));

  const opacity = cubicInterpolate(p0.opacity, p1.opacity, p2.opacity, p3.opacity, mu) / 100;
  const density = cubicInterpolate(p0.density, p1.density, p2.density, p3.density, mu) / 100;

  return {
    opacity: Math.max(0, Math.min(1, opacity)),
    density: Math.max(0, Math.min(1, density)),
  };
}
