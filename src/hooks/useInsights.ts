import { useState, useCallback, useRef } from 'react';
import { Insight, FilterState, AggregatedMetrics, Transaction } from '@/types';
import { generateInsights } from '@/api/claude';
import { buildInsightPayload } from '@/data/aggregations';

type InsightCache = Map<string, Insight[]>;

function filterKey(filters: FilterState): string {
  return JSON.stringify(filters);
}

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<InsightCache>(new Map());

  const fetchInsights = useCallback(
    async (transactions: Transaction[], metrics: AggregatedMetrics, filters: FilterState) => {
      const key = filterKey(filters);

      if (cache.current.has(key)) {
        setInsights(cache.current.get(key)!);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = buildInsightPayload(transactions, metrics, filters);
        const result = await generateInsights(payload);
        cache.current.set(key, result);
        setInsights(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate insights');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearInsights = useCallback(() => {
    setInsights([]);
    setError(null);
  }, []);

  return { insights, loading, error, fetchInsights, clearInsights };
}
