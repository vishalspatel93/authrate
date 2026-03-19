export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  status: 'approved' | 'declined';
  declineCode: string | null;
  declineCategory: 'soft' | 'hard' | null;
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'discover';
  cardType: 'credit' | 'debit' | 'prepaid';
  transactionType: 'one_time' | 'recurring' | 'card_on_file' | 'moto';
  binRange: string;
  issuer: string;
  country: string;
  isDomestic: boolean;
  tokenType: 'pan' | 'psp_token' | 'network_token';
  threeDSStatus: 'challenged' | 'frictionless' | 'not_enrolled' | 'na';
  merchantCategoryCode: string;
}

export interface GeneratorConfig {
  transactionCount: number;
  dateRange: { start: Date; end: Date };
  seed: number;
}

export interface FilterState {
  dateRange: { start: Date; end: Date };
  cardBrand: string[];
  cardType: string[];
  transactionType: string[];
  tokenType: string[];
  threeDSStatus: string[];
  isDomestic: boolean | null;
  declineCode: string[];
  issuer: string[];
  amountBand: string[];
}

export interface AggregatedMetrics {
  total: number;
  approved: number;
  declined: number;
  authRate: number;
  totalVolume: number;
  avgAmount: number;
  estimatedDeclineCost: number;
}

export interface DimensionBreakdown {
  label: string;
  total: number;
  approved: number;
  declined: number;
  authRate: number;
  volume: number;
}

export interface TimeSeriesPoint {
  date: string;
  authRate: number;
  total: number;
  approved: number;
  declined: number;
  [key: string]: number | string;
}

export interface DeclineCodeData {
  code: string;
  name: string;
  count: number;
  percentage: number;
  category: 'soft' | 'hard';
  estimatedImpact: number;
}

export interface HeatmapCell {
  row: string;
  col: string;
  authRate: number;
  total: number;
  approved: number;
  declined: number;
}

export interface Insight {
  id: string;
  category: 'tokenization' | 'retry_logic' | 'routing' | 'fraud_tuning' | '3ds_optimization' | 'issuer_specific' | 'general';
  title: string;
  description: string;
  currentMetric: string;
  projectedMetric: string;
  estimatedImpact: string;
  action: string;
  confidence: 'high' | 'medium' | 'low';
  supportingData: string;
}

export type Granularity = 'daily' | 'weekly' | 'monthly';

export type DashboardDimension =
  | 'cardBrand'
  | 'cardType'
  | 'transactionType'
  | 'tokenType'
  | 'threeDSStatus'
  | 'isDomestic'
  | 'amountBand'
  | 'issuer'
  | 'declineCode';

export interface SimulationScenario {
  id: string;
  type: 'tokenization' | 'retry' | 'threeds' | 'issuer_exclusion';
  label: string;
  enabled: boolean;
  params: Record<string, number | string | string[]>;
}

export interface SimulationResult {
  beforeAuthRate: number;
  afterAuthRate: number;
  beforeDeclineCount: number;
  afterDeclineCount: number;
  revenueImpact: number;
  narrative?: string;
}
