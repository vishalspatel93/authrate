import React, { useState } from 'react';
import { FilterState } from '@/types';
import { formatDateRange } from '@/utils/formatters';

interface HeaderProps {
  filters: FilterState;
  onSetFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  seed: number;
  onSeedChange: (seed: number) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  onOpenInsights: () => void;
  onOpenReport: () => void;
}

export default function Header({
  filters,
  onSetFilter,
  onClearAll,
  activeFilterCount,
  seed,
  onSeedChange,
  onRegenerate,
  isGenerating,
  onOpenInsights,
  onOpenReport,
}: HeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [localSeed, setLocalSeed] = useState(String(seed));

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const date = new Date(value + 'T00:00:00');
    onSetFilter('dateRange', { ...filters.dateRange, [field]: date });
  };

  const handleSeedApply = () => {
    const n = parseInt(localSeed, 10);
    if (!isNaN(n)) {
      onSeedChange(n);
      onRegenerate();
    }
    setShowSeedInput(false);
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#0A0F1A] z-30 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 11 L5 7 L8 9 L12 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-wide">AuthRate</span>
        </div>
        <span className="text-gray-600 text-xs">|</span>
        <span className="text-gray-400 text-xs hidden sm:block">Payment Authorization Analytics</span>
      </div>

      {/* Date range */}
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setShowDatePicker((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-700 hover:border-gray-600 text-gray-300 text-xs transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-gray-500">
            <rect x="1" y="3" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {formatDateRange(filters.dateRange.start, filters.dateRange.end)}
        </button>

        {showDatePicker && (
          <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl z-50 flex gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Start</label>
              <input
                type="date"
                value={filters.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">End</label>
              <input
                type="date"
                value={filters.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
              />
            </div>
            <button
              onClick={() => setShowDatePicker(false)}
              className="self-end text-xs text-blue-400 hover:text-blue-300"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {activeFilterCount > 0 && (
          <button onClick={onClearAll} className="text-xs text-gray-400 hover:text-white px-2 py-1 border border-gray-700 rounded transition-colors">
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}

        {/* Seed / regen */}
        <div className="relative flex items-center gap-1">
          {showSeedInput ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={localSeed}
                onChange={(e) => setLocalSeed(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSeedApply()}
                className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                placeholder="Seed"
                autoFocus
              />
              <button onClick={handleSeedApply} className="btn-primary text-xs py-1 px-2">Apply</button>
              <button onClick={() => setShowSeedInput(false)} className="btn-secondary text-xs py-1 px-2">✕</button>
            </div>
          ) : (
            <>
              <button
                onClick={() => { setLocalSeed(String(seed)); setShowSeedInput(true); }}
                className="btn-secondary text-xs"
              >
                Seed: {seed}
              </button>
              <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="btn-secondary text-xs disabled:opacity-50"
              >
                {isGenerating ? '...' : '↺ Regenerate'}
              </button>
            </>
          )}
        </div>

        <button onClick={onOpenReport} className="btn-secondary text-xs">
          Report
        </button>

        <button onClick={onOpenInsights} className="btn-primary text-xs flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.2"/>
            <path d="M8 5v4M8 11v0.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          AI Insights
        </button>
      </div>
    </header>
  );
}
