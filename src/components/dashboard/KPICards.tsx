import React from 'react';
import { AggregatedMetrics } from '@/types';
import { formatPercent, formatNumber, formatCurrency, formatDelta, getAuthRateColorClass } from '@/utils/formatters';

interface KPICardsProps {
  metrics: AggregatedMetrics;
  baseline: AggregatedMetrics;
  loading?: boolean;
}

function Skeleton() {
  return <div className="skeleton h-8 w-32 rounded" />;
}

function DeltaBadge({ current, baseline, format }: { current: number; baseline: number; format: 'percent' | 'number' }) {
  const delta = current - baseline;
  if (Math.abs(delta) < 0.001) return null;
  const { text, positive } = formatDelta(format === 'percent' ? delta : (delta / baseline) * 100);
  return (
    <span className={`text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {text} vs all
    </span>
  );
}

export default function KPICards({ metrics, baseline, loading }: KPICardsProps) {
  const authRateColor = getAuthRateColorClass(metrics.authRate);

  return (
    <div className="grid grid-cols-4 gap-3 px-4 pt-3 pb-2 flex-shrink-0">
      {/* Auth Rate */}
      <div className="chart-container p-4 flex flex-col gap-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Auth Rate</span>
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <span className={`kpi-number ${authRateColor}`}>{formatPercent(metrics.authRate)}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${metrics.authRate >= 93 ? 'bg-emerald-400' : metrics.authRate >= 90 ? 'bg-amber-400' : 'bg-red-400'}`} />
              <DeltaBadge current={metrics.authRate} baseline={baseline.authRate} format="percent" />
            </div>
          </>
        )}
      </div>

      {/* Approved */}
      <div className="chart-container p-4 flex flex-col gap-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Approved</span>
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <span className="kpi-number text-white">{formatNumber(metrics.approved)}</span>
            <div className="mt-1">
              <span className="text-xs text-gray-500">{formatPercent(metrics.total > 0 ? (metrics.approved / metrics.total) * 100 : 0)} of total</span>
            </div>
          </>
        )}
      </div>

      {/* Declined */}
      <div className="chart-container p-4 flex flex-col gap-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Declined</span>
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <span className="kpi-number text-red-400">{formatNumber(metrics.declined)}</span>
            <div className="mt-1">
              <DeltaBadge current={metrics.declined} baseline={baseline.declined} format="number" />
            </div>
          </>
        )}
      </div>

      {/* Est. Revenue Impact */}
      <div className="chart-container p-4 flex flex-col gap-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Est. Decline Cost</span>
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <span className="kpi-number text-amber-400">{formatCurrency(metrics.estimatedDeclineCost, true)}</span>
            <div className="mt-1">
              <span className="text-xs text-gray-500">{formatNumber(metrics.total)} total txns</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
