import React from 'react';
import { Insight } from '@/types';
import InsightCard from './InsightCard';
import { DEMO_MODE } from '@/config';

interface InsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  insights: Insight[];
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  onSimulate: (insight: Insight) => void;
}

export default function InsightsPanel({
  isOpen, onClose, insights, loading, error, onGenerate, onSimulate,
}: InsightsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0D1320] border-l border-gray-800 flex flex-col z-40 slide-in shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-400 flex-shrink-0">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 5v4M8 11v0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-sm font-semibold text-white">AI Insights</span>
          {insights.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full flex-shrink-0">{insights.length}</span>
          )}
          {DEMO_MODE && (
            <span className="text-xs text-amber-500 bg-amber-900/20 border border-amber-900/40 px-1.5 py-0.5 rounded-full flex-shrink-0">
              Demo
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg leading-none flex-shrink-0 ml-2">×</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-w-0">
        {/* Demo mode banner */}
        {DEMO_MODE ? (
          <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg px-3 py-2.5 text-xs text-amber-400/80 leading-relaxed break-words">
            These insights are pre-generated from the seed-42 dataset and shown in read-only demo mode.
            To enable live AI generation, set{' '}
            <code className="font-mono bg-amber-900/20 px-1 rounded">DEMO_MODE = false</code>
            {' '}in{' '}
            <code className="font-mono bg-amber-900/20 px-1 rounded">src/config.ts</code>.
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onGenerate}
              disabled={loading}
              className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing data…
                </>
              ) : insights.length > 0 ? (
                '↻ Refresh Insights'
              ) : (
                'Generate Insights'
              )}
            </button>
          </div>
        )}

        {error && !DEMO_MODE && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-xs text-red-400 break-words">
            {error}
          </div>
        )}

        {!DEMO_MODE && !loading && insights.length === 0 && !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-gray-700 mb-3">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M20 12v10M20 26v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-sm text-gray-500 max-w-[200px]">
              Generate AI-powered insights from your current dataset
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Insights are contextual to active filters
            </p>
          </div>
        )}

        {!DEMO_MODE && loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-800 rounded-lg p-4 flex flex-col gap-2">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="skeleton h-12 rounded" />
                  <div className="skeleton h-12 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onSimulate={onSimulate} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-800 text-xs text-gray-600">
        {DEMO_MODE
          ? 'Pre-generated insights · Seed 42 · 50K transactions · 90-day window'
          : 'Powered by Claude claude-sonnet-4-6 · Insights reflect current filter state'}
      </div>
    </div>
  );
}
