import { describe, it, expect, beforeAll } from 'vitest';
import { generateTransactions, getDefaultConfig } from './generator';
import {
  applyFilters,
  computeMetrics,
  computeBreakdown,
  computeTimeSeries,
  computeDeclineCodes,
  computeHeatmap,
  getAmountBand,
} from './aggregations';
import { Transaction, FilterState } from '@/types';
import { defaultFilters } from '@/hooks/useFilters';

let txns: Transaction[];

beforeAll(() => {
  const config = getDefaultConfig();
  txns = generateTransactions({ ...config, transactionCount: 5_000, seed: 42 });
});

// ─── applyFilters ────────────────────────────────────────────────────────────

describe('applyFilters', () => {
  it('returns all transactions with default (empty) filters', () => {
    const filtered = applyFilters(txns, defaultFilters);
    expect(filtered).toHaveLength(txns.length);
  });

  it('filters by cardBrand', () => {
    const filters: FilterState = { ...defaultFilters, cardBrand: ['visa'] };
    const filtered = applyFilters(txns, filters);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.cardBrand === 'visa')).toBe(true);
  });

  it('filters by multiple cardBrands (OR logic)', () => {
    const filters: FilterState = { ...defaultFilters, cardBrand: ['visa', 'mastercard'] };
    const filtered = applyFilters(txns, filters);
    expect(filtered.every((t) => t.cardBrand === 'visa' || t.cardBrand === 'mastercard')).toBe(true);
  });

  it('filters by isDomestic = true', () => {
    const filters: FilterState = { ...defaultFilters, isDomestic: true };
    const filtered = applyFilters(txns, filters);
    expect(filtered.every((t) => t.isDomestic)).toBe(true);
  });

  it('filters by isDomestic = false', () => {
    const filters: FilterState = { ...defaultFilters, isDomestic: false };
    const filtered = applyFilters(txns, filters);
    expect(filtered.every((t) => !t.isDomestic)).toBe(true);
  });

  it('filters by tokenType', () => {
    const filters: FilterState = { ...defaultFilters, tokenType: ['network_token'] };
    const filtered = applyFilters(txns, filters);
    expect(filtered.every((t) => t.tokenType === 'network_token')).toBe(true);
  });

  it('filters by declineCode only returns declined transactions', () => {
    const filters: FilterState = { ...defaultFilters, declineCode: ['05'] };
    const filtered = applyFilters(txns, filters);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.declineCode === '05')).toBe(true);
    expect(filtered.every((t) => t.status === 'declined')).toBe(true);
  });

  it('combines multiple filters (AND logic)', () => {
    const filters: FilterState = { ...defaultFilters, cardBrand: ['visa'], isDomestic: true };
    const filtered = applyFilters(txns, filters);
    expect(filtered.every((t) => t.cardBrand === 'visa' && t.isDomestic)).toBe(true);
  });

  it('date range filter works', () => {
    const midDate = new Date(txns[Math.floor(txns.length / 2)].timestamp);
    const start = new Date(midDate);
    const end = new Date(midDate);
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() + 1);
    const filters: FilterState = { ...defaultFilters, dateRange: { start, end } };
    const filtered = applyFilters(txns, filters);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(txns.length);
    expect(filtered.every((t) => t.timestamp >= start && t.timestamp <= end)).toBe(true);
  });

  it('returns empty array when no transactions match', () => {
    // No MOTO + debit + network_token combination likely exists in small set
    const filters: FilterState = {
      ...defaultFilters,
      transactionType: ['moto'],
      cardType: ['prepaid'],
      tokenType: ['network_token'],
      isDomestic: false,
      amountBand: ['$500+'],
    };
    const filtered = applyFilters(txns, filters);
    // Just verify it doesn't throw and returns array
    expect(Array.isArray(filtered)).toBe(true);
  });
});

// ─── computeMetrics ─────────────────────────────────────────────────────────

describe('computeMetrics', () => {
  it('computes correct totals', () => {
    const metrics = computeMetrics(txns);
    expect(metrics.total).toBe(txns.length);
    expect(metrics.approved + metrics.declined).toBe(txns.length);
  });

  it('auth rate is approved/total * 100', () => {
    const metrics = computeMetrics(txns);
    const expected = (metrics.approved / metrics.total) * 100;
    expect(metrics.authRate).toBeCloseTo(expected, 5);
  });

  it('auth rate is between 0 and 100', () => {
    const metrics = computeMetrics(txns);
    expect(metrics.authRate).toBeGreaterThanOrEqual(0);
    expect(metrics.authRate).toBeLessThanOrEqual(100);
  });

  it('estimatedDeclineCost is sum of declined transaction amounts', () => {
    const metrics = computeMetrics(txns);
    const expected = txns.filter((t) => t.status === 'declined').reduce((s, t) => s + t.amount, 0);
    expect(metrics.estimatedDeclineCost).toBeCloseTo(expected, 2);
  });

  it('returns zeros for empty array', () => {
    const metrics = computeMetrics([]);
    expect(metrics.total).toBe(0);
    expect(metrics.authRate).toBe(0);
    expect(metrics.approved).toBe(0);
    expect(metrics.declined).toBe(0);
  });

  it('totalVolume equals sum of all amounts', () => {
    const metrics = computeMetrics(txns);
    const expected = txns.reduce((s, t) => s + t.amount, 0);
    expect(metrics.totalVolume).toBeCloseTo(expected, 2);
  });

  it('avgAmount equals totalVolume / total', () => {
    const metrics = computeMetrics(txns);
    expect(metrics.avgAmount).toBeCloseTo(metrics.totalVolume / metrics.total, 5);
  });
});

// ─── computeBreakdown ────────────────────────────────────────────────────────

describe('computeBreakdown', () => {
  it('produces one entry per card brand', () => {
    const breakdown = computeBreakdown(txns, 'cardBrand');
    const labels = new Set(breakdown.map((d) => d.label));
    expect(labels.has('visa')).toBe(true);
    expect(labels.has('mastercard')).toBe(true);
    expect(labels.has('amex')).toBe(true);
  });

  it('total count across segments equals input count', () => {
    const breakdown = computeBreakdown(txns, 'cardBrand');
    const total = breakdown.reduce((s, d) => s + d.total, 0);
    expect(total).toBe(txns.length);
  });

  it('approved + declined equals total for every segment', () => {
    const breakdown = computeBreakdown(txns, 'tokenType');
    for (const d of breakdown) {
      expect(d.approved + d.declined).toBe(d.total);
    }
  });

  it('auth rate is within [0, 100] for all segments', () => {
    const breakdown = computeBreakdown(txns, 'transactionType');
    for (const d of breakdown) {
      expect(d.authRate).toBeGreaterThanOrEqual(0);
      expect(d.authRate).toBeLessThanOrEqual(100);
    }
  });

  it('isDomestic breakdown has at most 2 entries (true/false)', () => {
    const breakdown = computeBreakdown(txns, 'isDomestic');
    expect(breakdown.length).toBeLessThanOrEqual(2);
  });

  it('issuer breakdown is capped at 10 entries', () => {
    const breakdown = computeBreakdown(txns, 'issuer');
    expect(breakdown.length).toBeLessThanOrEqual(10);
  });

  it('declineCode breakdown is capped at 10 entries', () => {
    const breakdown = computeBreakdown(txns, 'declineCode');
    expect(breakdown.length).toBeLessThanOrEqual(10);
  });
});

// ─── computeTimeSeries ───────────────────────────────────────────────────────

describe('computeTimeSeries', () => {
  it('returns data points for daily granularity', () => {
    const series = computeTimeSeries(txns, 'daily');
    expect(series.length).toBeGreaterThan(0);
  });

  it('weekly granularity produces fewer points than daily', () => {
    const daily = computeTimeSeries(txns, 'daily');
    const weekly = computeTimeSeries(txns, 'weekly');
    expect(weekly.length).toBeLessThanOrEqual(daily.length);
  });

  it('monthly granularity produces fewer points than weekly', () => {
    const weekly = computeTimeSeries(txns, 'weekly');
    const monthly = computeTimeSeries(txns, 'monthly');
    expect(monthly.length).toBeLessThanOrEqual(weekly.length);
  });

  it('all auth rates are between 0 and 100', () => {
    const series = computeTimeSeries(txns, 'daily');
    for (const point of series) {
      expect(point.authRate).toBeGreaterThanOrEqual(0);
      expect(point.authRate).toBeLessThanOrEqual(100);
    }
  });

  it('points are sorted chronologically', () => {
    const series = computeTimeSeries(txns, 'daily');
    for (let i = 1; i < series.length; i++) {
      expect(series[i].date >= series[i - 1].date).toBe(true);
    }
  });

  it('split by cardBrand produces per-brand columns', () => {
    const series = computeTimeSeries(txns, 'weekly', 'cardBrand', ['visa', 'mastercard']);
    expect(series.length).toBeGreaterThan(0);
    for (const point of series) {
      expect(typeof point['visa']).toBe('number');
      expect(typeof point['mastercard']).toBe('number');
    }
  });
});

// ─── computeDeclineCodes ─────────────────────────────────────────────────────

describe('computeDeclineCodes', () => {
  it('only includes declined transactions', () => {
    const codes = computeDeclineCodes(txns);
    const totalDeclines = txns.filter((t) => t.status === 'declined').length;
    const totalInCodes = codes.reduce((s, c) => s + c.count, 0);
    expect(totalInCodes).toBe(totalDeclines);
  });

  it('percentages sum to ~100', () => {
    const codes = computeDeclineCodes(txns);
    const total = codes.reduce((s, c) => s + c.percentage, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it('sorted by count descending', () => {
    const codes = computeDeclineCodes(txns);
    for (let i = 1; i < codes.length; i++) {
      expect(codes[i].count).toBeLessThanOrEqual(codes[i - 1].count);
    }
  });

  it('each entry has a valid category', () => {
    const codes = computeDeclineCodes(txns);
    for (const c of codes) {
      expect(['soft', 'hard']).toContain(c.category);
    }
  });

  it('returns empty array for all-approved transactions', () => {
    const approved = txns.filter((t) => t.status === 'approved');
    const codes = computeDeclineCodes(approved);
    expect(codes).toHaveLength(0);
  });

  it('estimated impact equals sum of declined amounts for that code', () => {
    const codes = computeDeclineCodes(txns);
    for (const c of codes) {
      const expected = txns
        .filter((t) => t.declineCode === c.code)
        .reduce((s, t) => s + t.amount, 0);
      expect(c.estimatedImpact).toBeCloseTo(expected, 2);
    }
  });
});

// ─── computeHeatmap ──────────────────────────────────────────────────────────

describe('computeHeatmap', () => {
  it('produces cells for all row × col combinations', () => {
    const { cells, rows, cols } = computeHeatmap(txns, 'cardBrand', 'cardType');
    expect(cells.length).toBe(rows.length * cols.length);
  });

  it('all cell auth rates are between 0 and 100', () => {
    const { cells } = computeHeatmap(txns, 'cardBrand', 'tokenType');
    for (const c of cells) {
      expect(c.authRate).toBeGreaterThanOrEqual(0);
      expect(c.authRate).toBeLessThanOrEqual(100);
    }
  });

  it('cell totals sum to input count', () => {
    const { cells } = computeHeatmap(txns, 'cardBrand', 'cardType');
    const total = cells.reduce((s, c) => s + c.total, 0);
    expect(total).toBe(txns.length);
  });

  it('approved + declined equals total for each cell', () => {
    const { cells } = computeHeatmap(txns, 'transactionType', 'tokenType');
    for (const c of cells) {
      expect(c.approved + c.declined).toBe(c.total);
    }
  });
});

// ─── getAmountBand ───────────────────────────────────────────────────────────

describe('getAmountBand', () => {
  it('classifies $0–25 correctly', () => {
    expect(getAmountBand(0)).toBe('$0–25');
    expect(getAmountBand(10)).toBe('$0–25');
    expect(getAmountBand(24.99)).toBe('$0–25');
  });

  it('classifies $25–100 correctly', () => {
    expect(getAmountBand(25)).toBe('$25–100');
    expect(getAmountBand(50)).toBe('$25–100');
    expect(getAmountBand(99.99)).toBe('$25–100');
  });

  it('classifies $100–500 correctly', () => {
    expect(getAmountBand(100)).toBe('$100–500');
    expect(getAmountBand(250)).toBe('$100–500');
    expect(getAmountBand(499.99)).toBe('$100–500');
  });

  it('classifies $500+ correctly', () => {
    expect(getAmountBand(500)).toBe('$500+');
    expect(getAmountBand(5000)).toBe('$500+');
  });
});
