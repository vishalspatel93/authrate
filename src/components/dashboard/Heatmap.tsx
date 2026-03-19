import React, { useState, useRef, useEffect } from 'react';
import { HeatmapCell, DashboardDimension } from '@/types';
import { DIMENSION_LABELS, VALUE_LABELS } from '@/data/constants';
import { authRateToColor } from '@/utils/colors';
import { formatPercent, formatNumber } from '@/utils/formatters';

interface HeatmapProps {
  cells: HeatmapCell[];
  rows: string[];
  cols: string[];
  rowDimension: DashboardDimension;
  colDimension: DashboardDimension;
  onRowDimensionChange: (d: DashboardDimension) => void;
  onColDimensionChange: (d: DashboardDimension) => void;
  onCellClick: (rowDim: DashboardDimension, rowVal: string, colDim: DashboardDimension, colVal: string) => void;
  loading?: boolean;
}

const DIMENSION_OPTIONS: DashboardDimension[] = [
  'cardBrand', 'cardType', 'transactionType', 'tokenType',
  'threeDSStatus', 'isDomestic', 'amountBand',
];

interface TooltipState {
  x: number;
  y: number;
  cell: HeatmapCell;
}

export default function Heatmap({
  cells, rows, cols, rowDimension, colDimension,
  onRowDimensionChange, onColDimensionChange, onCellClick, loading,
}: HeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLabel = (val: string) => VALUE_LABELS[val] ?? val;
  const getCell = (row: string, col: string) =>
    cells.find((c) => c.row === row && c.col === col);

  const CELL_W = 80;
  const CELL_H = 32;
  const ROW_LABEL_W = 110;
  const COL_LABEL_H = 48;
  const PADDING = 4;

  const svgWidth = ROW_LABEL_W + cols.length * (CELL_W + PADDING) + 40;
  const svgHeight = COL_LABEL_H + rows.length * (CELL_H + PADDING) + 20;

  return (
    <div className="chart-container mx-4 mb-3 p-4 flex flex-col" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Cross-Tab Heatmap</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Rows:</span>
            <select
              value={rowDimension}
              onChange={(e) => onRowDimensionChange(e.target.value as DashboardDimension)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
            >
              {DIMENSION_OPTIONS.filter((d) => d !== colDimension).map((d) => (
                <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Cols:</span>
            <select
              value={colDimension}
              onChange={(e) => onColDimensionChange(e.target.value as DashboardDimension)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
            >
              {DIMENSION_OPTIONS.filter((d) => d !== rowDimension).map((d) => (
                <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 skeleton rounded" />
      ) : (
        <div className="flex-1 overflow-auto relative" ref={containerRef}>
          <svg
            width={svgWidth}
            height={svgHeight}
            style={{ display: 'block' }}
          >
            {/* Column headers */}
            {cols.map((col, ci) => (
              <text
                key={col}
                x={ROW_LABEL_W + ci * (CELL_W + PADDING) + CELL_W / 2}
                y={COL_LABEL_H - 8}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize={10}
                style={{ userSelect: 'none' }}
              >
                {getLabel(col).length > 10 ? getLabel(col).slice(0, 10) + '…' : getLabel(col)}
              </text>
            ))}

            {/* Row labels + cells */}
            {rows.map((row, ri) => (
              <g key={row}>
                <text
                  x={ROW_LABEL_W - 8}
                  y={COL_LABEL_H + ri * (CELL_H + PADDING) + CELL_H / 2 + 4}
                  textAnchor="end"
                  fill="#9CA3AF"
                  fontSize={10}
                  style={{ userSelect: 'none' }}
                >
                  {getLabel(row).length > 14 ? getLabel(row).slice(0, 14) + '…' : getLabel(row)}
                </text>
                {cols.map((col, ci) => {
                  const cell = getCell(row, col);
                  const rate = cell?.authRate ?? 0;
                  const hasData = cell && cell.total > 0;
                  return (
                    <g key={col}>
                      <rect
                        x={ROW_LABEL_W + ci * (CELL_W + PADDING)}
                        y={COL_LABEL_H + ri * (CELL_H + PADDING)}
                        width={CELL_W}
                        height={CELL_H}
                        rx={3}
                        fill={hasData ? authRateToColor(rate) : '#1F2937'}
                        opacity={hasData ? 0.85 : 0.3}
                        style={{ cursor: hasData ? 'pointer' : 'default' }}
                        onClick={() => hasData && onCellClick(rowDimension, row, colDimension, col)}
                        onMouseEnter={(e) => {
                          if (hasData && cell) {
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (rect) {
                              setTooltip({
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                                cell,
                              });
                            }
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                      {hasData && (
                        <text
                          x={ROW_LABEL_W + ci * (CELL_W + PADDING) + CELL_W / 2}
                          y={COL_LABEL_H + ri * (CELL_H + PADDING) + CELL_H / 2 + 4}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.9)"
                          fontSize={10}
                          fontWeight="600"
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        >
                          {formatPercent(rate, 1)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="tooltip-base absolute z-50 pointer-events-none"
              style={{ left: tooltip.x + 8, top: tooltip.y - 60 }}
            >
              <div className="font-medium text-white text-xs mb-1">
                {getLabel(tooltip.cell.row)} × {getLabel(tooltip.cell.col)}
              </div>
              <div className="grid grid-cols-2 gap-x-3 text-xs">
                <span className="text-gray-400">Auth Rate</span>
                <span className="text-white font-medium">{formatPercent(tooltip.cell.authRate)}</span>
                <span className="text-gray-400">Total</span>
                <span className="text-white">{formatNumber(tooltip.cell.total)}</span>
                <span className="text-gray-400">Declined</span>
                <span className="text-red-400">{formatNumber(tooltip.cell.declined)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
