import { useMemo } from 'react';
import { Transaction, FilterState, DashboardDimension, Granularity } from '@/types';
import {
  applyFilters,
  computeMetrics,
  computeBreakdown,
  computeTimeSeries,
  computeDeclineCodes,
  computeHeatmap,
} from '@/data/aggregations';

export function useAggregatedData(
  transactions: Transaction[],
  filters: FilterState,
  granularity: Granularity,
  leftDimension: DashboardDimension,
  rightDimension: DashboardDimension,
  heatmapRow: DashboardDimension,
  heatmapCol: DashboardDimension,
  splitDimension?: DashboardDimension,
  splitValues?: string[]
) {
  const filtered = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);

  const baselineMetrics = useMemo(() => computeMetrics(transactions), [transactions]);

  const leftBreakdown = useMemo(() => computeBreakdown(filtered, leftDimension), [filtered, leftDimension]);

  const rightBreakdown = useMemo(() => computeBreakdown(filtered, rightDimension), [filtered, rightDimension]);

  const timeSeries = useMemo(
    () => computeTimeSeries(filtered, granularity, splitDimension, splitValues),
    [filtered, granularity, splitDimension, splitValues]
  );

  const declineCodes = useMemo(() => computeDeclineCodes(filtered), [filtered]);

  const heatmap = useMemo(
    () => computeHeatmap(filtered, heatmapRow, heatmapCol),
    [filtered, heatmapRow, heatmapCol]
  );

  return { filtered, metrics, baselineMetrics, leftBreakdown, rightBreakdown, timeSeries, declineCodes, heatmap };
}
