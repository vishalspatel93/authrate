import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DeclineCodeData } from '@/types';
import { formatNumber, formatPercent, formatCurrency } from '@/utils/formatters';

interface DeclineCodeChartProps {
  data: DeclineCodeData[];
  activeDeclineCodes: string[];
  onBarClick: (code: string) => void;
  loading?: boolean;
}

const BAR_HEIGHT = 30;
const CHART_HEADER_H = 52;
const CHART_PADDING = 32; // top + bottom margin inside chart

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload as DeclineCodeData;
  return (
    <div className="tooltip-base">
      <div className="font-medium text-white mb-1">{d.code} — {d.name}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        <span className="text-gray-400">Count</span><span className="text-white">{formatNumber(d.count)}</span>
        <span className="text-gray-400">% of declines</span><span className="text-white">{formatPercent(d.percentage)}</span>
        <span className="text-gray-400">Est. impact</span><span className="text-amber-400">{formatCurrency(d.estimatedImpact, true)}</span>
        <span className="text-gray-400">Category</span>
        <span className={d.category === 'soft' ? 'text-blue-400' : 'text-red-400'}>
          {d.category === 'soft' ? 'Soft' : 'Hard'}
        </span>
      </div>
    </div>
  );
};

export default function DeclineCodeChart({ data, activeDeclineCodes, onBarClick, loading }: DeclineCodeChartProps) {
  const [showAll, setShowAll] = useState(false);
  const displayData = showAll ? data : data.slice(0, 10);

  const chartData = displayData.map((d) => ({
    ...d,
    displayName: `${d.code} — ${d.name}`,
  }));

  // Compute explicit chart height so ResponsiveContainer has a real pixel value
  const chartHeight = displayData.length * BAR_HEIGHT + CHART_PADDING;

  return (
    <div className="chart-container mx-4 mb-3 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Decline Code Distribution</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Soft</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Hard</span>
          </div>
          {data.length > 10 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {showAll ? 'Show less' : `Show all (${data.length})`}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="skeleton rounded" style={{ height: chartHeight }} />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center text-gray-600 text-xs" style={{ height: 80 }}>
          No declined transactions in selection
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
            onClick={(e) => {
              if (e?.activePayload?.[0]?.payload?.code) {
                onBarClick(e.activePayload[0].payload.code);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#6B7280', fontSize: 10 }}
              tickFormatter={(v) => formatNumber(v)}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              width={148}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar
              dataKey="count"
              radius={[0, 3, 3, 0]}
              cursor="pointer"
              label={{
                position: 'right',
                fill: '#6B7280',
                fontSize: 10,
                formatter: (_v: number, entry: any) => formatPercent(entry?.payload?.percentage ?? 0, 1),
              }}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.category === 'soft' ? '#3B82F6' : '#EF4444'}
                  opacity={activeDeclineCodes.includes(entry.code) ? 1 : activeDeclineCodes.length > 0 ? 0.4 : 0.75}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
