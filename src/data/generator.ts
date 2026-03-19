import { Transaction, GeneratorConfig } from '@/types';
import { BIN_RANGES, DECLINE_CODES, COUNTRIES, MERCHANT_CATEGORY_CODES } from './constants';

// Mulberry32 seeded PRNG
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedRandom<T>(rng: () => number, items: { value: T; weight: number }[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function randomBetween(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function randomDate(rng: () => number, start: Date, end: Date): Date {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return new Date(startMs + rng() * (endMs - startMs));
}

export function generateTransactions(config: GeneratorConfig): Transaction[] {
  const rng = mulberry32(config.seed);
  const transactions: Transaction[] = [];
  const bins = Object.keys(BIN_RANGES);

  for (let i = 0; i < config.transactionCount; i++) {
    const bin = bins[Math.floor(rng() * bins.length)];
    const binInfo = BIN_RANGES[bin];

    // Card brand
    const cardBrand = binInfo.brand;

    // Card type with correlation: prepaid skews higher on certain issuers
    const cardType = weightedRandom(rng, [
      { value: 'credit' as const, weight: 55 },
      { value: 'debit' as const, weight: 35 },
      { value: 'prepaid' as const, weight: 10 },
    ]);

    // Transaction type with correlation to token type
    const transactionType = weightedRandom(rng, [
      { value: 'one_time' as const, weight: 40 },
      { value: 'recurring' as const, weight: 30 },
      { value: 'card_on_file' as const, weight: 20 },
      { value: 'moto' as const, weight: 10 },
    ]);

    // Token type: network tokens skew toward recurring/COF
    const tokenWeight =
      transactionType === 'recurring' || transactionType === 'card_on_file'
        ? [
            { value: 'network_token' as const, weight: 45 },
            { value: 'psp_token' as const, weight: 35 },
            { value: 'pan' as const, weight: 20 },
          ]
        : [
            { value: 'network_token' as const, weight: 25 },
            { value: 'psp_token' as const, weight: 35 },
            { value: 'pan' as const, weight: 40 },
          ];
    const tokenType = weightedRandom(rng, tokenWeight);

    // 3DS: prepaid and moto skew toward not_enrolled
    const threeDSWeight =
      cardType === 'prepaid' || transactionType === 'moto'
        ? [
            { value: 'frictionless' as const, weight: 20 },
            { value: 'challenged' as const, weight: 10 },
            { value: 'not_enrolled' as const, weight: 45 },
            { value: 'na' as const, weight: 25 },
          ]
        : [
            { value: 'frictionless' as const, weight: 40 },
            { value: 'challenged' as const, weight: 20 },
            { value: 'not_enrolled' as const, weight: 25 },
            { value: 'na' as const, weight: 15 },
          ];
    const threeDSStatus = weightedRandom(rng, threeDSWeight);

    // Country (prepaid cards have higher international rate)
    const countryPool =
      cardType === 'prepaid'
        ? COUNTRIES.map((c) => ({ value: c.code, weight: c.domestic ? 40 : c.weight * 2 }))
        : COUNTRIES.map((c) => ({ value: c.code, weight: c.weight }));
    const country = weightedRandom(rng, countryPool);
    const isDomestic = country === 'US';

    // Amount — log-normal-ish distribution
    const amount = parseFloat(
      Math.max(
        1,
        weightedRandom(rng, [
          { value: randomBetween(rng, 1, 25), weight: 25 },
          { value: randomBetween(rng, 25, 100), weight: 40 },
          { value: randomBetween(rng, 100, 500), weight: 25 },
          { value: randomBetween(rng, 500, 5000), weight: 10 },
        ])
      ).toFixed(2)
    );

    const timestamp = randomDate(rng, config.dateRange.start, config.dateRange.end);
    const hour = timestamp.getHours();

    // --- Auth rate calculation ---
    // Base rates by dimension
    let approvalProb = 0.93; // overall baseline

    // Card brand
    if (cardBrand === 'visa') approvalProb = 0.94;
    else if (cardBrand === 'mastercard') approvalProb = 0.93;
    else if (cardBrand === 'amex') approvalProb = 0.91;
    else if (cardBrand === 'discover') approvalProb = 0.92;

    // Card type delta
    if (cardType === 'debit') approvalProb += 0.03;
    else if (cardType === 'prepaid') approvalProb -= 0.08;

    // Token type delta
    if (tokenType === 'network_token') approvalProb += 0.04;
    else if (tokenType === 'pan') approvalProb -= 0.02;

    // 3DS delta
    if (threeDSStatus === 'frictionless') approvalProb += 0.02;
    else if (threeDSStatus === 'challenged') approvalProb -= 0.05;
    else if (threeDSStatus === 'not_enrolled') approvalProb -= 0.03;

    // Transaction type delta
    if (transactionType === 'recurring' || transactionType === 'card_on_file') approvalProb += 0.03;
    else if (transactionType === 'moto') approvalProb -= 0.04;

    // Domestic penalty
    if (!isDomestic) approvalProb -= 0.08;

    // Amount band
    if (amount <= 25) approvalProb += 0.02;
    else if (amount <= 100) approvalProb += 0.00;
    else if (amount <= 500) approvalProb -= 0.03;
    else approvalProb -= 0.08;

    // Time of day (2-5 AM fraud scoring tighter)
    if (hour >= 2 && hour <= 5) approvalProb -= 0.02;

    // First National anomaly: high decline on >$200
    if (binInfo.issuer === 'First National' && amount > 200) approvalProb -= 0.12;

    // Clamp
    approvalProb = Math.min(0.99, Math.max(0.5, approvalProb));

    const status: 'approved' | 'declined' = rng() < approvalProb ? 'approved' : 'declined';

    let declineCode: string | null = null;
    let declineCategory: 'soft' | 'hard' | null = null;

    if (status === 'declined') {
      const declineCodes = Object.entries(DECLINE_CODES).map(([code, info]) => ({
        value: code,
        weight: info.weight,
      }));
      declineCode = weightedRandom(rng, declineCodes);
      declineCategory = DECLINE_CODES[declineCode].category;
    }

    transactions.push({
      id: `txn_${i.toString(36).padStart(8, '0')}`,
      timestamp,
      amount,
      status,
      declineCode,
      declineCategory,
      cardBrand,
      cardType,
      transactionType,
      binRange: bin,
      issuer: binInfo.issuer,
      country,
      isDomestic,
      tokenType,
      threeDSStatus,
      merchantCategoryCode: MERCHANT_CATEGORY_CODES[Math.floor(rng() * MERCHANT_CATEGORY_CODES.length)],
    });
  }

  return transactions;
}

export function getDefaultConfig(): GeneratorConfig {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  return {
    transactionCount: 50000,
    dateRange: { start, end },
    seed: 42,
  };
}
