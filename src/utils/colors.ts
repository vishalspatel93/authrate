export const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#F43F5E', // rose
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
];

export const AUTH_RATE_GRADIENT = {
  low: '#EF4444',    // red    < 85%
  mid: '#F59E0B',    // amber  ~90%
  high: '#10B981',   // green  > 93%
};

export function authRateToColor(rate: number, min = 80, max = 100): string {
  const clamped = Math.max(min, Math.min(max, rate));
  const normalized = (clamped - min) / (max - min); // 0 to 1

  if (normalized < 0.5) {
    // red → amber
    const t = normalized * 2;
    return blendColors('#EF4444', '#F59E0B', t);
  } else {
    // amber → green
    const t = (normalized - 0.5) * 2;
    return blendColors('#F59E0B', '#10B981', t);
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function blendColors(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
