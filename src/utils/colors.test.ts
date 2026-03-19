import { describe, it, expect } from 'vitest';
import { authRateToColor, getChartColor, CHART_COLORS } from './colors';

describe('authRateToColor', () => {
  it('returns a valid rgb string', () => {
    const color = authRateToColor(90);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('returns pure red at min (80)', () => {
    expect(authRateToColor(80)).toBe('rgb(239,68,68)'); // #EF4444
  });

  it('returns pure green at max (100)', () => {
    expect(authRateToColor(100)).toBe('rgb(16,185,129)'); // #10B981
  });

  it('clamps values below min to red', () => {
    expect(authRateToColor(50)).toBe(authRateToColor(80));
  });

  it('clamps values above max to green', () => {
    expect(authRateToColor(150)).toBe(authRateToColor(100));
  });

  it('midpoint (90) is near amber', () => {
    const mid = authRateToColor(90);
    // Should not be the pure red or pure green
    expect(mid).not.toBe('rgb(239,68,68)');
    expect(mid).not.toBe('rgb(16,185,129)');
  });
});

describe('getChartColor', () => {
  it('returns a valid hex color', () => {
    expect(getChartColor(0)).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('cycles through palette', () => {
    expect(getChartColor(0)).toBe(getChartColor(CHART_COLORS.length));
  });

  it('returns different colors for adjacent indices', () => {
    expect(getChartColor(0)).not.toBe(getChartColor(1));
  });
});
