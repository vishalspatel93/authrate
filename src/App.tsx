import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Transaction, DashboardDimension, Granularity, Insight, FilterState } from '@/types';
import { generateTransactions, getDefaultConfig } from '@/data/generator';
import { useFilters } from '@/hooks/useFilters';
import { useAggregatedData } from '@/hooks/useAggregatedData';
import { useInsights } from '@/hooks/useInsights';
import { computeBreakdown } from '@/data/aggregations';
import { DEMO_MODE } from '@/config';
import { STATIC_INSIGHTS } from '@/data/staticInsights';

import Header from '@/components/layout/Header';
import FilterBar from '@/components/filters/FilterBar';
import KPICards from '@/components/dashboard/KPICards';
import AuthRateTrend from '@/components/dashboard/AuthRateTrend';
import BreakdownChart from '@/components/dashboard/BreakdownChart';
import DeclineCodeChart from '@/components/dashboard/DeclineCodeChart';
import Heatmap from '@/components/dashboard/Heatmap';
import InsightsPanel from '@/components/insights/InsightsPanel';
import SimulationBuilder from '@/components/insights/SimulationBuilder';
import ReportGenerator from '@/components/reports/ReportGenerator';

export default function App() {
  // Data generation state
  const [seed, setSeed] = useState(42);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const config = getDefaultConfig();
    return generateTransactions({ ...config, seed: 42 });
  });

  // UI state
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [leftDimension, setLeftDimension] = useState<DashboardDimension>('cardBrand');
  const [rightDimension, setRightDimension] = useState<DashboardDimension>('transactionType');
  const [heatmapRow, setHeatmapRow] = useState<DashboardDimension>('cardBrand');
  const [heatmapCol, setHeatmapCol] = useState<DashboardDimension>('amountBand');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  const { filters, setFilter, applyDimensionFilter, clearFilter, clearAllFilters, activeFilterCount } = useFilters();
  const { insights: liveInsights, loading: insightsLoading, error: insightsError, fetchInsights } = useInsights();
  const insights = DEMO_MODE ? STATIC_INSIGHTS : liveInsights;

  const {
    filtered,
    metrics,
    baselineMetrics,
    leftBreakdown,
    rightBreakdown,
    timeSeries,
    declineCodes,
    heatmap,
  } = useAggregatedData(
    transactions,
    filters,
    granularity,
    leftDimension,
    rightDimension,
    heatmapRow,
    heatmapCol
  );

  const handleRegenerate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const config = getDefaultConfig();
      setTransactions(generateTransactions({ ...config, seed }));
      setIsGenerating(false);
    }, 50);
  }, [seed]);

  const handleRemoveFilter = useCallback((key: keyof FilterState, value?: string) => {
    if (key === 'isDomestic') {
      setFilter('isDomestic', null);
    } else if (value) {
      const current = filters[key] as string[];
      setFilter(key as any, current.filter((v) => v !== value));
    } else {
      clearFilter(key);
    }
  }, [filters, setFilter, clearFilter]);

  const handleBarClick = useCallback((dimension: DashboardDimension, value: string) => {
    applyDimensionFilter(dimension, value);
  }, [applyDimensionFilter]);

  const handleHeatmapCellClick = useCallback(
    (rowDim: DashboardDimension, rowVal: string, colDim: DashboardDimension, colVal: string) => {
      applyDimensionFilter(rowDim, rowVal);
      applyDimensionFilter(colDim, colVal);
    },
    [applyDimensionFilter]
  );

  const handleDeclineCodeClick = useCallback((code: string) => {
    applyDimensionFilter('declineCode', code);
  }, [applyDimensionFilter]);

  const handleGenerateInsights = useCallback(() => {
    fetchInsights(filtered, metrics, filters);
  }, [filtered, metrics, filters, fetchInsights]);

  const handleSimulate = useCallback((insight: Insight) => {
    setSelectedInsight(insight);
    setSimulationOpen(true);
  }, []);

  // Breakdowns for report
  const reportBreakdowns = useMemo(() => ({
    cardBrand: computeBreakdown(filtered, 'cardBrand'),
    cardType: computeBreakdown(filtered, 'cardType'),
    tokenType: computeBreakdown(filtered, 'tokenType'),
    threeDSStatus: computeBreakdown(filtered, 'threeDSStatus'),
  }), [filtered]);

  const activeLeftValues = (filters[leftDimension as keyof FilterState] as string[]) ?? [];
  const activeRightValues = (filters[rightDimension as keyof FilterState] as string[]) ?? [];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0A0F1A]">
      {/* Header */}
      <Header
        filters={filters}
        onSetFilter={setFilter}
        onClearAll={clearAllFilters}
        activeFilterCount={activeFilterCount}
        seed={seed}
        onSeedChange={setSeed}
        onRegenerate={handleRegenerate}
        isGenerating={isGenerating}
        onOpenInsights={() => setInsightsPanelOpen(true)}
        onOpenReport={() => setReportOpen(true)}
      />

      {/* Filter bar */}
      <FilterBar filters={filters} onRemoveFilter={handleRemoveFilter} />

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* KPI Cards */}
        <KPICards metrics={metrics} baseline={baselineMetrics} loading={isGenerating} />

        {/* Trend Chart */}
        <AuthRateTrend
          data={timeSeries}
          granularity={granularity}
          onGranularityChange={setGranularity}
          loading={isGenerating}
        />

        {/* Breakdown charts / Heatmap toggle */}
        <div className="flex items-center gap-2 px-4 mb-2">
          <button
            onClick={() => setShowHeatmap(false)}
            className={!showHeatmap ? 'btn-active text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}
          >
            Breakdown Charts
          </button>
          <button
            onClick={() => setShowHeatmap(true)}
            className={showHeatmap ? 'btn-active text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}
          >
            Heatmap
          </button>
        </div>

        {showHeatmap ? (
          <div style={{ height: 320 }} className="flex">
            <div className="flex-1 min-w-0">
              <Heatmap
                cells={heatmap.cells}
                rows={heatmap.rows}
                cols={heatmap.cols}
                rowDimension={heatmapRow}
                colDimension={heatmapCol}
                onRowDimensionChange={setHeatmapRow}
                onColDimensionChange={setHeatmapCol}
                onCellClick={handleHeatmapCellClick}
                loading={isGenerating}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 mb-3" style={{ height: 280 }}>
            <BreakdownChart
              data={leftBreakdown}
              dimension={leftDimension}
              onDimensionChange={setLeftDimension}
              onBarClick={handleBarClick}
              activeValues={activeLeftValues}
              loading={isGenerating}
            />
            <BreakdownChart
              data={rightBreakdown}
              dimension={rightDimension}
              onDimensionChange={setRightDimension}
              onBarClick={handleBarClick}
              activeValues={activeRightValues}
              loading={isGenerating}
            />
          </div>
        )}

        {/* Decline Code Chart — self-sizing based on row count */}
        <DeclineCodeChart
          data={declineCodes}
          activeDeclineCodes={filters.declineCode}
          onBarClick={handleDeclineCodeClick}
          loading={isGenerating}
        />
      </div>

      {/* Overlays */}
      <InsightsPanel
        isOpen={insightsPanelOpen}
        onClose={() => setInsightsPanelOpen(false)}
        insights={insights}
        loading={insightsLoading}
        error={insightsError}
        onGenerate={handleGenerateInsights}
        onSimulate={handleSimulate}
      />

      <SimulationBuilder
        isOpen={simulationOpen}
        onClose={() => { setSimulationOpen(false); setSelectedInsight(null); }}
        transactions={filtered}
        metrics={metrics}
        initialInsight={selectedInsight}
      />

      <ReportGenerator
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        metrics={metrics}
        filters={filters}
        declineCodes={declineCodes}
        breakdowns={reportBreakdowns}
        insights={insights}
      />

      {/* Mobile warning */}
      <div className="sm:hidden fixed inset-0 bg-[#0A0F1A] flex items-center justify-center text-center p-6 z-[100]">
        <div>
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-lg font-semibold text-white mb-2">Desktop recommended</h2>
          <p className="text-sm text-gray-400">AuthRate is optimized for desktop viewing. The data density requires a larger screen.</p>
          <button
            onClick={(e) => (e.currentTarget.parentElement!.parentElement!.style.display = 'none')}
            className="mt-4 text-xs text-blue-400 hover:text-blue-300"
          >
            Continue anyway →
          </button>
        </div>
      </div>
    </div>
  );
}
