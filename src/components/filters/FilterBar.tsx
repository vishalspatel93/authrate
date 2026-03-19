import React from 'react';
import { FilterState, DashboardDimension } from '@/types';
import { DIMENSION_LABELS, VALUE_LABELS } from '@/data/constants';

interface FilterBarProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState, value?: string) => void;
}

interface Chip {
  key: keyof FilterState;
  value?: string;
  label: string;
}

export default function FilterBar({ filters, onRemoveFilter }: FilterBarProps) {
  const chips: Chip[] = [];

  const arrayKeys: Array<{ key: keyof FilterState; dim: string }> = [
    { key: 'cardBrand', dim: 'Card Brand' },
    { key: 'cardType', dim: 'Card Type' },
    { key: 'transactionType', dim: 'Txn Type' },
    { key: 'tokenType', dim: 'Token' },
    { key: 'threeDSStatus', dim: '3DS' },
    { key: 'declineCode', dim: 'Code' },
    { key: 'issuer', dim: 'Issuer' },
    { key: 'amountBand', dim: 'Amount' },
  ];

  for (const { key, dim } of arrayKeys) {
    const values = filters[key] as string[];
    for (const v of values) {
      chips.push({
        key,
        value: v,
        label: `${dim}: ${VALUE_LABELS[v] ?? v}`,
      });
    }
  }

  if (filters.isDomestic !== null) {
    chips.push({
      key: 'isDomestic',
      label: filters.isDomestic ? 'Domestic' : 'International',
    });
  }

  if (chips.length === 0) {
    return (
      <div className="flex items-center px-4 py-1.5 border-b border-gray-800 bg-[#0A0F1A] flex-shrink-0">
        <span className="text-xs text-gray-600 italic">No active filters — click any chart element to filter</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-800 bg-[#0A0F1A] flex-shrink-0 overflow-x-auto">
      <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">Filters:</span>
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onRemoveFilter(chip.key, chip.value)}
          className="filter-chip whitespace-nowrap flex-shrink-0"
        >
          {chip.label}
          <span className="text-blue-400 hover:text-white">×</span>
        </button>
      ))}
    </div>
  );
}
