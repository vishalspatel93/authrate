import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TimeSeriesPoint, Granularity } from '@/types';
import { formatDate, formatPercent, formatNumber } from '@/utils/formatters';
import { AUTH_RATE_TARGET } from '@/data/constants';
import { getChartColor } from '@/utils/colors';

interface AuthRateTrendProps {
  data: TimeSeriesPoint[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  splitKeys?: string[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tooltip-base">
      <div className="font-medium text-white mb-1">{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="text-white font-medium">{formatPercent(entry.value)}</span>
        </div>
      ))}
      {payload[0]?.payload?.total && (
        <div className="mt-1 pt-1 border-t border-gray-600 text-gray-400">
          {formatNumber(payload[0].payload.total)} txns
        </div>
      )}
    </div>
  );
};

export default function AuthRateTrend({ data, granularity, onGranularityChange, splitKeys, loading }: AuthRateTrendProps) {
  const hasSplit = splitKeys && splitKeys.length > 1;

  const formatXAxis = (tick: string) => {
    if (!tick) return '';
    const d = new Date(tick + 'T12:00:00');
    if (granularity === 'monthly') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chart-container mx-4 mb-3 p-4 flex flex-col flex-shrink-0" style={{ height: 220 }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">Auth Rate Trend</span>
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly'] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => onGranularityChange(g)}
              className={granularity === g ? 'btn-active text-xs py-0.5 px-2' : 'btn-secondary text-xs py-0.5 px-2'}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="skeleton w-full h-full rounded" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: '#6B7280', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fill: '#6B7280', fontSize: 10 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            {hasSplit && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />}
            <ReferenceLine
              y={AUTH_RATE_TARGET}
              stroke="#374151"
              strokeDasharray="6 3"
              label={{ value: `${AUTH_RATE_TARGET}% target`, fill: '#6B7280', fontSize: 10, position: 'right' }}
            />
            {hasSplit ? (
              splitKeys!.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={getChartColor(i)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name={key}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey="authRate"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="Auth Rate"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
