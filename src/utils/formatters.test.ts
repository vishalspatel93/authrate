import { describe, it, expect } from 'vitest';
import {
  formatPercent,
  formatNumber,
  formatCurrency,
  formatDelta,
  getAuthRateColor,
  getAuthRateColorClass,
} from './formatters';

describe('formatPercent', () => {
  it('formats with 2 decimal places by default', () => {
    expect(formatPercent(93.1234)).toBe('93.12%');
  });

  it('formats with custom decimal places', () => {
    expect(formatPercent(93.1234, 1)).toBe('93.1%');
    expect(formatPercent(93.1234, 0)).toBe('93%');
  });

  it('handles 0', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('handles 100', () => {
    expect(formatPercent(100)).toBe('100.00%');
  });
});

describe('formatNumber', () => {
  it('formats with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('rounds floats', () => {
    expect(formatNumber(1234.7)).toBe('1,235');
  });

  it('handles 0', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatCurrency', () => {
  it('formats USD without compact', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
  });

  it('formats compact thousands', () => {
    expect(formatCurrency(12500, true)).toBe('$12.5K');
  });

  it('formats compact millions', () => {
    expect(formatCurrency(1_500_000, true)).toBe('$1.5M');
  });

  it('formats compact under 1K', () => {
    expect(formatCurrency(500, true)).toBe('$500');
  });
});

describe('formatDelta', () => {
  it('shows up arrow for positive delta', () => {
    const result = formatDelta(2.5);
    expect(result.text).toContain('↑');
    expect(result.text).toContain('2.50%');
    expect(result.positive).toBe(true);
  });

  it('shows down arrow for negative delta', () => {
    const result = formatDelta(-1.3);
    expect(result.text).toContain('↓');
    expect(result.text).toContain('1.30%');
    expect(result.positive).toBe(false);
  });

  it('treats zero as positive', () => {
    expect(formatDelta(0).positive).toBe(true);
  });
});

describe('getAuthRateColor', () => {
  it('returns green for rate >= 93', () => {
    expect(getAuthRateColor(93)).toBe('#10B981');
    expect(getAuthRateColor(99)).toBe('#10B981');
  });

  it('returns amber for rate 90–92.99', () => {
    expect(getAuthRateColor(90)).toBe('#F59E0B');
    expect(getAuthRateColor(92.99)).toBe('#F59E0B');
  });

  it('returns red for rate < 90', () => {
    expect(getAuthRateColor(89)).toBe('#EF4444');
    expect(getAuthRateColor(0)).toBe('#EF4444');
  });
});

describe('getAuthRateColorClass', () => {
  it('returns emerald class >= 93', () => {
    expect(getAuthRateColorClass(95)).toBe('text-emerald-400');
  });

  it('returns amber class 90–92.99', () => {
    expect(getAuthRateColorClass(91)).toBe('text-amber-400');
  });

  it('returns red class < 90', () => {
    expect(getAuthRateColorClass(85)).toBe('text-red-400');
  });
});
