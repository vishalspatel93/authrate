import { Transaction, FilterState, AggregatedMetrics, DimensionBreakdown, TimeSeriesPoint, DeclineCodeData, HeatmapCell, Granularity, DashboardDimension } from '@/types';
import { DECLINE_CODES, AMOUNT_BANDS } from './constants';

export function applyFilters(transactions: Transaction[], filters: FilterState): Transaction[] {
  return transactions.filter((t) => {
    if (t.timestamp < filters.dateRange.start || t.timestamp > filters.dateRange.end) return false;
    if (filters.cardBrand.length > 0 && !filters.cardBrand.includes(t.cardBrand)) return false;
    if (filters.cardType.length > 0 && !filters.cardType.includes(t.cardType)) return false;
    if (filters.transactionType.length > 0 && !filters.transactionType.includes(t.transactionType)) return false;
    if (filters.tokenType.length > 0 && !filters.tokenType.includes(t.tokenType)) return false;
    if (filters.threeDSStatus.length > 0 && !filters.threeDSStatus.includes(t.threeDSStatus)) return false;
    if (filters.isDomestic !== null && t.isDomestic !== filters.isDomestic) return false;
    if (filters.declineCode.length > 0 && (t.declineCode === null || !filters.declineCode.includes(t.declineCode))) return false;
    if (filters.issuer.length > 0 && !filters.issuer.includes(t.issuer)) return false;
    if (filters.amountBand.length > 0) {
      const band = getAmountBand(t.amount);
      if (!filters.amountBand.includes(band)) return false;
    }
    return true;
  });
}

export function getAmountBand(amount: number): string {
  for (const band of AMOUNT_BANDS) {
    if (amount >= band.min && amount < band.max) return band.label;
  }
  return AMOUNT_BANDS[AMOUNT_BANDS.length - 1].label;
}

export function computeMetrics(transactions: Transaction[]): AggregatedMetrics {
  const total = transactions.length;
  const approved = transactions.filter((t) => t.status === 'approved').length;
  const declined = total - approved;
  const authRate = total > 0 ? (approved / total) * 100 : 0;
  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = total > 0 ? totalVolume / total : 0;
  const declinedVolume = transactions.filter((t) => t.status === 'declined').reduce((sum, t) => sum + t.amount, 0);

  return { total, approved, declined, authRate, totalVolume, avgAmount, estimatedDeclineCost: declinedVolume };
}

export function computeBreakdown(transactions: Transaction[], dimension: DashboardDimension): DimensionBreakdown[] {
  const groups = new Map<string, { total: number; approved: number; volume: number }>();

  for (const t of transactions) {
    const key = getDimensionValue(t, dimension);
    const existing = groups.get(key) || { total: 0, approved: 0, volume: 0 };
    existing.total++;
    if (t.status === 'approved') existing.approved++;
    existing.volume += t.amount;
    groups.set(key, existing);
  }

  const results: DimensionBreakdown[] = [];
  for (const [label, data] of groups.entries()) {
    results.push({
      label,
      total: data.total,
      approved: data.approved,
      declined: data.total - data.approved,
      authRate: data.total > 0 ? (data.approved / data.total) * 100 : 0,
      volume: data.volume,
    });
  }

  // For issuer and decline code, limit to top 10 by volume
  if (dimension === 'issuer' || dimension === 'declineCode') {
    return results.sort((a, b) => b.total - a.total).slice(0, 10);
  }

  return results.sort((a, b) => b.authRate - a.authRate);
}

export function getDimensionValue(t: Transaction, dimension: DashboardDimension): string {
  switch (dimension) {
    case 'cardBrand': return t.cardBrand;
    case 'cardType': return t.cardType;
    case 'transactionType': return t.transactionType;
    case 'tokenType': return t.tokenType;
    case 'threeDSStatus': return t.threeDSStatus;
    case 'isDomestic': return String(t.isDomestic);
    case 'amountBand': return getAmountBand(t.amount);
    case 'issuer': return t.issuer;
    case 'declineCode': return t.declineCode ?? 'APPROVED';
    default: return 'unknown';
  }
}

export function computeTimeSeries(
  transactions: Transaction[],
  granularity: Granularity,
  splitDimension?: DashboardDimension,
  splitValues?: string[]
): TimeSeriesPoint[] {
  const getKey = (date: Date): string => {
    if (granularity === 'daily') {
      return date.toISOString().split('T')[0];
    } else if (granularity === 'weekly') {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  };

  if (!splitDimension || !splitValues || splitValues.length === 0) {
    const groups = new Map<string, { total: number; approved: number }>();
    for (const t of transactions) {
      const key = getKey(t.timestamp);
      const existing = groups.get(key) || { total: 0, approved: 0 };
      existing.total++;
      if (t.status === 'approved') existing.approved++;
      groups.set(key, existing);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        authRate: data.total > 0 ? (data.approved / data.total) * 100 : 0,
        total: data.total,
        approved: data.approved,
        declined: data.total - data.approved,
      }));
  }

  // Split by dimension
  const groups = new Map<string, Map<string, { total: number; approved: number }>>();
  for (const t of transactions) {
    const dateKey = getKey(t.timestamp);
    const dimValue = getDimensionValue(t, splitDimension);
    if (!splitValues.includes(dimValue)) continue;
    if (!groups.has(dateKey)) groups.set(dateKey, new Map());
    const dateGroup = groups.get(dateKey)!;
    const existing = dateGroup.get(dimValue) || { total: 0, approved: 0 };
    existing.total++;
    if (t.status === 'approved') existing.approved++;
    dateGroup.set(dimValue, existing);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dimMap]) => {
      const point: TimeSeriesPoint = { date, authRate: 0, total: 0, approved: 0, declined: 0 };
      let totalAll = 0;
      let approvedAll = 0;
      for (const val of splitValues) {
        const data = dimMap.get(val) || { total: 0, approved: 0 };
        point[val] = data.total > 0 ? (data.approved / data.total) * 100 : 0;
        totalAll += data.total;
        approvedAll += data.approved;
      }
      point.total = totalAll;
      point.approved = approvedAll;
      point.declined = totalAll - approvedAll;
      point.authRate = totalAll > 0 ? (approvedAll / totalAll) * 100 : 0;
      return point;
    });
}

export function computeDeclineCodes(transactions: Transaction[]): DeclineCodeData[] {
  const declined = transactions.filter((t) => t.status === 'declined');
  const total = declined.length;
  const groups = new Map<string, { count: number; volume: number }>();

  for (const t of declined) {
    const code = t.declineCode ?? 'OTHER';
    const existing = groups.get(code) || { count: 0, volume: 0 };
    existing.count++;
    existing.volume += t.amount;
    groups.set(code, existing);
  }

  return Array.from(groups.entries())
    .map(([code, data]) => ({
      code,
      name: DECLINE_CODES[code]?.name ?? 'Unknown',
      count: data.count,
      percentage: total > 0 ? (data.count / total) * 100 : 0,
      category: DECLINE_CODES[code]?.category ?? 'soft',
      estimatedImpact: data.volume,
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeHeatmap(
  transactions: Transaction[],
  rowDimension: DashboardDimension,
  colDimension: DashboardDimension
): { cells: HeatmapCell[]; rows: string[]; cols: string[] } {
  const groups = new Map<string, Map<string, { total: number; approved: number }>>();
  const rowSet = new Set<string>();
  const colSet = new Set<string>();

  for (const t of transactions) {
    const row = getDimensionValue(t, rowDimension);
    const col = getDimensionValue(t, colDimension);
    rowSet.add(row);
    colSet.add(col);
    if (!groups.has(row)) groups.set(row, new Map());
    const rowMap = groups.get(row)!;
    const existing = rowMap.get(col) || { total: 0, approved: 0 };
    existing.total++;
    if (t.status === 'approved') existing.approved++;
    rowMap.set(col, existing);
  }

  const rows = Array.from(rowSet).sort();
  const cols = Array.from(colSet).sort();
  const cells: HeatmapCell[] = [];

  for (const row of rows) {
    for (const col of cols) {
      const data = groups.get(row)?.get(col) || { total: 0, approved: 0 };
      cells.push({
        row,
        col,
        authRate: data.total > 0 ? (data.approved / data.total) * 100 : 0,
        total: data.total,
        approved: data.approved,
        declined: data.total - data.approved,
      });
    }
  }

  return { cells, rows, cols };
}

export function buildInsightPayload(
  transactions: Transaction[],
  metrics: AggregatedMetrics,
  filters: FilterState
): object {
  const dimensions: DashboardDimension[] = ['cardBrand', 'cardType', 'transactionType', 'tokenType', 'threeDSStatus', 'isDomestic', 'amountBand'];
  const breakdowns: Record<string, DimensionBreakdown[]> = {};
  for (const dim of dimensions) {
    breakdowns[dim] = computeBreakdown(transactions, dim);
  }

  const topIssuers = computeBreakdown(transactions, 'issuer');
  const declineCodes = computeDeclineCodes(transactions);
  const activeFilters = Object.entries(filters)
    .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v !== null))
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);

  return {
    summary: {
      totalTransactions: metrics.total,
      authRate: `${metrics.authRate.toFixed(2)}%`,
      approved: metrics.approved,
      declined: metrics.declined,
      estimatedDeclineCost: `$${(metrics.estimatedDeclineCost / 1000).toFixed(1)}K`,
    },
    activeFilters,
    breakdowns,
    topIssuers,
    topDeclineCodes: declineCodes.slice(0, 10),
  };
}
