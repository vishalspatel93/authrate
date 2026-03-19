import React from 'react';
import { Insight } from '@/types';

interface InsightCardProps {
  insight: Insight;
  onSimulate: (insight: Insight) => void;
}

const CATEGORY_COLORS: Record<Insight['category'], string> = {
  tokenization: 'text-blue-400 bg-blue-900/30 border-blue-800',
  retry_logic: 'text-violet-400 bg-violet-900/30 border-violet-800',
  routing: 'text-cyan-400 bg-cyan-900/30 border-cyan-800',
  fraud_tuning: 'text-rose-400 bg-rose-900/30 border-rose-800',
  '3ds_optimization': 'text-amber-400 bg-amber-900/30 border-amber-800',
  issuer_specific: 'text-orange-400 bg-orange-900/30 border-orange-800',
  general: 'text-gray-400 bg-gray-800/30 border-gray-700',
};

const CATEGORY_LABELS: Record<Insight['category'], string> = {
  tokenization: 'Tokenization',
  retry_logic: 'Retry Logic',
  routing: 'Routing',
  fraud_tuning: 'Fraud Tuning',
  '3ds_optimization': '3DS',
  issuer_specific: 'Issuer',
  general: 'General',
};

const CONFIDENCE_COLORS: Record<Insight['confidence'], string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-gray-500',
};

export default function InsightCard({ insight, onSimulate }: InsightCardProps) {
  return (
    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40 flex flex-col gap-3 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLORS[insight.category]}`}>
              {CATEGORY_LABELS[insight.category]}
            </span>
            <span className={`text-xs ${CONFIDENCE_COLORS[insight.confidence]}`}>
              {insight.confidence} confidence
            </span>
          </div>
          <h4 className="text-sm font-semibold text-white leading-snug">{insight.title}</h4>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-xs font-bold text-emerald-400">{insight.estimatedImpact}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed">{insight.description}</p>

      {/* Metrics comparison */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-xs text-gray-500 mb-0.5">Current</div>
          <div className="text-xs text-white font-medium">{insight.currentMetric}</div>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-900/40 rounded p-2">
          <div className="text-xs text-emerald-600 mb-0.5">Projected</div>
          <div className="text-xs text-emerald-400 font-medium">{insight.projectedMetric}</div>
        </div>
      </div>

      {/* Supporting data */}
      <div className="text-xs text-gray-500 italic">{insight.supportingData}</div>

      {/* Action */}
      <div className="flex items-start gap-2 bg-blue-900/10 border border-blue-900/30 rounded p-2.5">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-blue-400 flex-shrink-0 mt-0.5">
          <path d="M8 2L8 8M8 8L5 5M8 8L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="text-xs text-blue-300">{insight.action}</span>
      </div>

      <button
        onClick={() => onSimulate(insight)}
        className="text-xs text-center py-1.5 border border-gray-700 rounded hover:border-blue-600 hover:text-blue-400 text-gray-400 transition-colors"
      >
        Simulate this recommendation →
      </button>
    </div>
  );
}
