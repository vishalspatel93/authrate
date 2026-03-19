export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function formatDelta(delta: number): { text: string; positive: boolean } {
  const abs = Math.abs(delta);
  const positive = delta >= 0;
  return {
    text: `${positive ? '↑' : '↓'} ${abs.toFixed(2)}%`,
    positive,
  };
}

export function getAuthRateColor(rate: number): string {
  if (rate >= 93) return '#10B981';
  if (rate >= 90) return '#F59E0B';
  return '#EF4444';
}

export function getAuthRateColorClass(rate: number): string {
  if (rate >= 93) return 'text-emerald-400';
  if (rate >= 90) return 'text-amber-400';
  return 'text-red-400';
}
