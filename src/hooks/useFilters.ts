import { useState, useCallback } from 'react';
import { FilterState } from '@/types';
import { getDefaultConfig } from '@/data/generator';

const config = getDefaultConfig();

export const defaultFilters: FilterState = {
  dateRange: config.dateRange,
  cardBrand: [],
  cardType: [],
  transactionType: [],
  tokenType: [],
  threeDSStatus: [],
  isDomestic: null,
  declineCode: [],
  issuer: [],
  amountBand: [],
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayFilter = useCallback(<K extends keyof FilterState>(key: K, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  }, []);

  const applyDimensionFilter = useCallback((dimension: string, value: string) => {
    const arrayKeys: (keyof FilterState)[] = [
      'cardBrand', 'cardType', 'transactionType', 'tokenType',
      'threeDSStatus', 'declineCode', 'issuer', 'amountBand',
    ];

    if (dimension === 'isDomestic') {
      setFilters((prev) => {
        const boolVal = value === 'true';
        const next = prev.isDomestic === boolVal ? null : boolVal;
        return { ...prev, isDomestic: next };
      });
      return;
    }

    const key = dimension as keyof FilterState;
    if (arrayKeys.includes(key)) {
      toggleArrayFilter(key, value);
    }
  }, [toggleArrayFilter]);

  const clearFilter = useCallback((key: keyof FilterState) => {
    if (key === 'isDomestic') {
      setFilters((prev) => ({ ...prev, isDomestic: null }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: [] }));
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'dateRange') return false;
    if (Array.isArray(v)) return v.length > 0;
    return v !== null;
  }).length;

  return { filters, setFilter, toggleArrayFilter, applyDimensionFilter, clearFilter, clearAllFilters, activeFilterCount };
}
