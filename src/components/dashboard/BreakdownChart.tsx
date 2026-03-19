import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { DimensionBreakdown, DashboardDimension } from '@/types';
import { formatPercent, formatNumber } from '@/utils/formatters';
import { DIMENSION_LABELS, VALUE_LABELS } from '@/data/constants';
import { authRateToColor } from '@/utils/colors';

interface BreakdownChartProps {
  data: DimensionBreakdown[];
  dimension: DashboardDimension;
  onDimensionChange: (d: DashboardDimension) => void;
  onBarClick: (dimension: DashboardDimension, value: string) => void;
  activeValues: string[];
  loading?: boolean;
}

const DIMENSION_OPTIONS: DashboardDimension[] = [
  'cardBrand', 'cardType', 'transactionType', 'tokenType',
  'threeDSStatus', 'isDomestic', 'amountBand', 'issuer', 'declineCode',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload as DimensionBreakdown;
  return (
    <div className="tooltip-base">
      <div className="font-medium text-white mb-1">{d.label}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        <span className="text-gray-400">Auth Rate</span><span className="text-white font-medium">{formatPercent(d.authRate)}</span>
        <span className="text-gray-400">Approved</span><span className="text-emerald-400">{formatNumber(d.approved)}</span>
        <span className="text-gray-400">Declined</span><span className="text-red-400">{formatNumber(d.declined)}</span>
        <span className="text-gray-400">Total</span><span className="text-white">{formatNumber(d.total)}</span>
      </div>
    </div>
  );
};

const CustomBar = (props: any) => {
  const { x, y, width, height, value, payload, activeValues } = props;
  const isActive = activeValues?.includes(payload?.label);
  return (
    <rect
      x={x} y={y} width={width} height={height}
      fill={authRateToColor(value)}
      opacity={isActive ? 1 : activeValues?.length > 0 ? 0.5 : 1}
      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
    />
  );
};

export default function BreakdownChart({
  data,
  dimension,
  onDimensionChange,
  onBarClick,
  activeValues,
  loading,
}: BreakdownChartProps) {
  const getLabel = (raw: string) => VALUE_LABELS[raw] ?? raw;

  const chartData = data.map((d) => ({ ...d, label: getLabel(d.label), rawLabel: d.label }));

  return (
    <div className="chart-container flex flex-col p-4" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <select
          value={dimension}
          onChange={(e) => onDimensionChange(e.target.value as DashboardDimension)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          {DIMENSION_OPTIONS.map((d) => (
            <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500">by auth rate</span>
      </div>

      {loading ? (
        <div className="flex-1 skeleton rounded" />
      ) : data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-xs">No data</div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              onClick={(e) => {
                if (e?.activePayload?.[0]?.payload) {
                  onBarClick(dimension, e.activePayload[0].payload.rawLabel);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
              <XAxis
                type="number"
                domain={[Math.max(0, Math.min(...data.map((d) => d.authRate)) - 5), 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: '#6B7280', fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={90}
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar
                dataKey="authRate"
                radius={[0, 3, 3, 0]}
                cursor="pointer"
                label={{
                  position: 'right',
                  fill: '#9CA3AF',
                  fontSize: 10,
                  formatter: (v: number) => formatPercent(v, 1),
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={authRateToColor(entry.authRate)}
                    opacity={activeValues.includes(entry.rawLabel) ? 1 : activeValues.length > 0 ? 0.45 : 1}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
