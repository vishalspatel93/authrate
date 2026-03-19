import React, { useState, useCallback } from 'react';
import { Transaction, AggregatedMetrics, Insight, SimulationResult } from '@/types';
import { formatPercent, formatCurrency, formatNumber } from '@/utils/formatters';
import { computeMetrics } from '@/data/aggregations';
import { generateSimulationNarrative } from '@/api/claude';

interface SimulationBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  metrics: AggregatedMetrics;
  initialInsight?: Insight | null;
}

type ScenarioType = 'tokenization' | 'retry' | 'threeds' | 'issuer_exclusion';

interface Scenario {
  type: ScenarioType;
  label: string;
  enabled: boolean;
  tokenCoverage?: number;        // 0-100
  retryRecoveryRate?: number;    // 0-100
  frictionlessTarget?: number;   // 0-100
  excludedIssuers?: string[];
}

function runSimulation(transactions: Transaction[], scenarios: Scenario[]): AggregatedMetrics {
  let simulated = [...transactions];

  for (const scenario of scenarios) {
    if (!scenario.enabled) continue;

    if (scenario.type === 'tokenization') {
      const target = (scenario.tokenCoverage ?? 80) / 100;
      const panTxns = simulated.filter((t) => t.tokenType === 'pan');
      const toConvert = Math.floor(panTxns.length * target);
      const convertIds = new Set(panTxns.slice(0, toConvert).map((t) => t.id));
      // Network token uplift: ~6% improvement in auth rate vs PAN
      simulated = simulated.map((t) => {
        if (!convertIds.has(t.id)) return t;
        const willApprove = t.status === 'declined' && Math.random() < 0.06 * (target);
        return willApprove ? { ...t, status: 'approved', declineCode: null, declineCategory: null, tokenType: 'network_token' } : { ...t, tokenType: 'network_token' };
      });
    }

    if (scenario.type === 'retry') {
      const recoveryRate = (scenario.retryRecoveryRate ?? 30) / 100;
      simulated = simulated.map((t) => {
        if (t.status !== 'declined' || t.declineCategory !== 'soft') return t;
        if (Math.random() < recoveryRate) return { ...t, status: 'approved', declineCode: null, declineCategory: null };
        return t;
      });
    }

    if (scenario.type === 'threeds') {
      const frictionlessTarget = (scenario.frictionlessTarget ?? 60) / 100;
      const challenged = simulated.filter((t) => t.threeDSStatus === 'challenged');
      const toShift = Math.floor(challenged.length * frictionlessTarget);
      const shiftIds = new Set(challenged.slice(0, toShift).map((t) => t.id));
      // Frictionless vs challenged: ~7% improvement
      simulated = simulated.map((t) => {
        if (!shiftIds.has(t.id)) return t;
        const willApprove = t.status === 'declined' && Math.random() < 0.07;
        return willApprove
          ? { ...t, status: 'approved', declineCode: null, declineCategory: null, threeDSStatus: 'frictionless' }
          : { ...t, threeDSStatus: 'frictionless' };
      });
    }

    if (scenario.type === 'issuer_exclusion') {
      const excluded = new Set(scenario.excludedIssuers ?? []);
      simulated = simulated.filter((t) => !excluded.has(t.issuer));
    }
  }

  return computeMetrics(simulated);
}

const ALL_ISSUERS = [
  'Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One',
  'US Bancorp', 'First National', 'TD Bank', 'Truist', 'PNC Bank',
];

export default function SimulationBuilder({ isOpen, onClose, transactions, metrics, initialInsight }: SimulationBuilderProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { type: 'tokenization', label: 'Expand Network Tokenization', enabled: false, tokenCoverage: 80 },
    { type: 'retry', label: 'Intelligent Retry on Soft Declines', enabled: false, retryRecoveryRate: 30 },
    { type: 'threeds', label: 'Optimize 3DS Challenge Rate', enabled: false, frictionlessTarget: 60 },
    { type: 'issuer_exclusion', label: 'Remove High-Decline Issuer Traffic', enabled: false, excludedIssuers: ['First National'] },
  ]);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  const simResult = runSimulation(transactions, scenarios);
  const anyEnabled = scenarios.some((s) => s.enabled);

  const updateScenario = (type: ScenarioType, patch: Partial<Scenario>) => {
    setScenarios((prev) => prev.map((s) => (s.type === type ? { ...s, ...patch } : s)));
    setNarrative(null);
  };

  const handleNarrative = async () => {
    setNarrativeLoading(true);
    try {
      const enabledScenarios = scenarios.filter((s) => s.enabled);
      const result = {
        beforeAuthRate: formatPercent(metrics.authRate),
        afterAuthRate: formatPercent(simResult.authRate),
        revenueRecovered: formatCurrency(metrics.estimatedDeclineCost - simResult.estimatedDeclineCost),
        transactionsRecovered: metrics.declined - simResult.declined,
      };
      const text = await generateSimulationNarrative(enabledScenarios, result);
      setNarrative(text);
    } catch {
      setNarrative('Could not generate narrative. Check your API connection.');
    } finally {
      setNarrativeLoading(false);
    }
  };

  if (!isOpen) return null;

  const delta = simResult.authRate - metrics.authRate;
  const revenueImpact = metrics.estimatedDeclineCost - simResult.estimatedDeclineCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#0D1320] border border-gray-700 rounded-xl w-[640px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <span className="font-semibold text-white">Optimization Simulator</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Before / After */}
          <div className="grid grid-cols-3 gap-3">
            <div className="chart-container p-3">
              <div className="text-xs text-gray-500 mb-1">Current Auth Rate</div>
              <div className="text-2xl font-bold font-mono text-white">{formatPercent(metrics.authRate)}</div>
              <div className="text-xs text-gray-600 mt-0.5">{formatNumber(metrics.declined)} declines</div>
            </div>
            <div className="chart-container p-3 border-blue-900/50">
              <div className="text-xs text-gray-500 mb-1">Projected Auth Rate</div>
              <div className={`text-2xl font-bold font-mono ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercent(simResult.authRate)}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {delta >= 0 ? '+' : ''}{formatPercent(delta)} change
              </div>
            </div>
            <div className="chart-container p-3 border-emerald-900/40">
              <div className="text-xs text-gray-500 mb-1">Revenue Recovery</div>
              <div className={`text-2xl font-bold font-mono ${revenueImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(revenueImpact, true)}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {formatNumber(Math.abs(metrics.declined - simResult.declined))} txns recovered
              </div>
            </div>
          </div>

          {/* Scenarios */}
          <div className="flex flex-col gap-3">
            {/* Tokenization */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scenarios[0].enabled}
                    onChange={(e) => updateScenario('tokenization', { enabled: e.target.checked })}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-sm font-medium text-white">Expand Network Tokenization</span>
                </label>
                <span className="text-xs text-blue-400">{scenarios[0].tokenCoverage}% coverage target</span>
              </div>
              <input
                type="range" min={0} max={100} value={scenarios[0].tokenCoverage}
                onChange={(e) => updateScenario('tokenization', { tokenCoverage: Number(e.target.value) })}
                className="w-full accent-blue-500"
                disabled={!scenarios[0].enabled}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Current</span><span>100% coverage</span>
              </div>
            </div>

            {/* Retry */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scenarios[1].enabled}
                    onChange={(e) => updateScenario('retry', { enabled: e.target.checked })}
                    className="w-4 h-4 accent-violet-500"
                  />
                  <span className="text-sm font-medium text-white">Intelligent Retry on Soft Declines</span>
                </label>
                <span className="text-xs text-violet-400">{scenarios[1].retryRecoveryRate}% recovery rate</span>
              </div>
              <input
                type="range" min={0} max={80} value={scenarios[1].retryRecoveryRate}
                onChange={(e) => updateScenario('retry', { retryRecoveryRate: Number(e.target.value) })}
                className="w-full accent-violet-500"
                disabled={!scenarios[1].enabled}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0%</span><span>80% recovery</span>
              </div>
            </div>

            {/* 3DS */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scenarios[2].enabled}
                    onChange={(e) => updateScenario('threeds', { enabled: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-sm font-medium text-white">Optimize 3DS Challenge Rate</span>
                </label>
                <span className="text-xs text-amber-400">{scenarios[2].frictionlessTarget}% frictionless target</span>
              </div>
              <input
                type="range" min={0} max={100} value={scenarios[2].frictionlessTarget}
                onChange={(e) => updateScenario('threeds', { frictionlessTarget: Number(e.target.value) })}
                className="w-full accent-amber-500"
                disabled={!scenarios[2].enabled}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Current %</span><span>100% frictionless</span>
              </div>
            </div>

            {/* Issuer exclusion */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scenarios[3].enabled}
                    onChange={(e) => updateScenario('issuer_exclusion', { enabled: e.target.checked })}
                    className="w-4 h-4 accent-rose-500"
                  />
                  <span className="text-sm font-medium text-white">Remove High-Decline Issuer Traffic</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ISSUERS.map((issuer) => {
                  const isSelected = scenarios[3].excludedIssuers?.includes(issuer);
                  return (
                    <button
                      key={issuer}
                      onClick={() => {
                        if (!scenarios[3].enabled) return;
                        const current = scenarios[3].excludedIssuers ?? [];
                        const next = isSelected ? current.filter((i) => i !== issuer) : [...current, issuer];
                        updateScenario('issuer_exclusion', { excludedIssuers: next });
                      }}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        isSelected
                          ? 'border-rose-600 bg-rose-900/30 text-rose-400'
                          : 'border-gray-700 text-gray-500 hover:border-gray-600'
                      } ${!scenarios[3].enabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {issuer}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Narrative */}
          {narrative && (
            <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-3 text-xs text-blue-300 leading-relaxed fade-in">
              {narrative}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={() => {
              setScenarios((prev) => prev.map((s) => ({ ...s, enabled: false })));
              setNarrative(null);
            }}
            className="btn-secondary text-sm"
          >
            Reset All
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleNarrative}
              disabled={!anyEnabled || narrativeLoading}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              {narrativeLoading ? 'Generating…' : 'AI Summary'}
            </button>
            <button onClick={onClose} className="btn-primary text-sm">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
