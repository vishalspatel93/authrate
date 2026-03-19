import { describe, it, expect } from 'vitest';
import { generateTransactions, getDefaultConfig } from './generator';
import { Transaction } from '@/types';

const SAMPLE_COUNT = 10_000;

function makeTransactions(seed = 42, count = SAMPLE_COUNT): Transaction[] {
  const config = getDefaultConfig();
  return generateTransactions({ ...config, transactionCount: count, seed });
}

describe('generateTransactions — structure', () => {
  const txns = makeTransactions();

  it('generates the requested number of transactions', () => {
    expect(txns).toHaveLength(SAMPLE_COUNT);
  });

  it('every transaction has required fields', () => {
    for (const t of txns) {
      expect(t.id).toBeTruthy();
      expect(t.timestamp).toBeInstanceOf(Date);
      expect(t.amount).toBeGreaterThan(0);
      expect(['approved', 'declined']).toContain(t.status);
      expect(['visa', 'mastercard', 'amex', 'discover']).toContain(t.cardBrand);
      expect(['credit', 'debit', 'prepaid']).toContain(t.cardType);
      expect(['pan', 'psp_token', 'network_token']).toContain(t.tokenType);
      expect(['challenged', 'frictionless', 'not_enrolled', 'na']).toContain(t.threeDSStatus);
      expect(['one_time', 'recurring', 'card_on_file', 'moto']).toContain(t.transactionType);
    }
  });

  it('approved transactions have null declineCode and declineCategory', () => {
    const approved = txns.filter((t) => t.status === 'approved');
    expect(approved.length).toBeGreaterThan(0);
    for (const t of approved) {
      expect(t.declineCode).toBeNull();
      expect(t.declineCategory).toBeNull();
    }
  });

  it('declined transactions have non-null declineCode and declineCategory', () => {
    const declined = txns.filter((t) => t.status === 'declined');
    expect(declined.length).toBeGreaterThan(0);
    for (const t of declined) {
      expect(t.declineCode).not.toBeNull();
      expect(['soft', 'hard']).toContain(t.declineCategory);
    }
  });

  it('all IDs are unique', () => {
    const ids = new Set(txns.map((t) => t.id));
    expect(ids.size).toBe(SAMPLE_COUNT);
  });

  it('timestamps fall within the configured date range', () => {
    const config = getDefaultConfig();
    for (const t of txns) {
      expect(t.timestamp.getTime()).toBeGreaterThanOrEqual(config.dateRange.start.getTime());
      expect(t.timestamp.getTime()).toBeLessThanOrEqual(config.dateRange.end.getTime());
    }
  });

  it('isDomestic is true iff country is US', () => {
    for (const t of txns) {
      expect(t.isDomestic).toBe(t.country === 'US');
    }
  });
});

describe('generateTransactions — seeded reproducibility', () => {
  it('same seed produces identical datasets', () => {
    const a = makeTransactions(99, 500);
    const b = makeTransactions(99, 500);
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id));
    expect(a.map((t) => t.status)).toEqual(b.map((t) => t.status));
    expect(a.map((t) => t.amount)).toEqual(b.map((t) => t.amount));
  });

  it('different seeds produce different datasets', () => {
    const a = makeTransactions(1, 200);
    const b = makeTransactions(2, 200);
    const sameStatuses = a.filter((t, i) => t.status === b[i].status).length;
    // Statuses should differ on at least some transactions
    expect(sameStatuses).toBeLessThan(200);
  });
});

describe('generateTransactions — realistic auth rate patterns', () => {
  const txns = makeTransactions(42, 50_000);

  function authRate(subset: Transaction[]): number {
    const approved = subset.filter((t) => t.status === 'approved').length;
    return (approved / subset.length) * 100;
  }

  it('overall auth rate is between 88% and 97%', () => {
    const rate = authRate(txns);
    expect(rate).toBeGreaterThan(88);
    expect(rate).toBeLessThan(97);
  });

  it('network tokens have higher auth rate than raw PAN', () => {
    const network = txns.filter((t) => t.tokenType === 'network_token');
    const pan = txns.filter((t) => t.tokenType === 'pan');
    expect(authRate(network)).toBeGreaterThan(authRate(pan));
  });

  it('debit cards have higher auth rate than prepaid', () => {
    const debit = txns.filter((t) => t.cardType === 'debit');
    const prepaid = txns.filter((t) => t.cardType === 'prepaid');
    expect(authRate(debit)).toBeGreaterThan(authRate(prepaid));
  });

  it('domestic transactions have higher auth rate than international', () => {
    const domestic = txns.filter((t) => t.isDomestic);
    const international = txns.filter((t) => !t.isDomestic);
    expect(authRate(domestic)).toBeGreaterThan(authRate(international));
  });

  it('frictionless 3DS has higher auth rate than challenged', () => {
    const frictionless = txns.filter((t) => t.threeDSStatus === 'frictionless');
    const challenged = txns.filter((t) => t.threeDSStatus === 'challenged');
    expect(authRate(frictionless)).toBeGreaterThan(authRate(challenged));
  });

  it('recurring/COF has higher auth rate than MOTO', () => {
    const recurring = txns.filter((t) => t.transactionType === 'recurring' || t.transactionType === 'card_on_file');
    const moto = txns.filter((t) => t.transactionType === 'moto');
    expect(authRate(recurring)).toBeGreaterThan(authRate(moto));
  });

  it('low-amount transactions ($0-25) have higher auth rate than high-amount ($500+)', () => {
    const low = txns.filter((t) => t.amount < 25);
    const high = txns.filter((t) => t.amount >= 500);
    expect(authRate(low)).toBeGreaterThan(authRate(high));
  });

  it('First National has elevated decline rate on amounts > $200', () => {
    const fnHigh = txns.filter((t) => t.issuer === 'First National' && t.amount > 200);
    const fnLow = txns.filter((t) => t.issuer === 'First National' && t.amount <= 200);
    expect(fnHigh.length).toBeGreaterThan(0);
    expect(fnLow.length).toBeGreaterThan(0);
    expect(authRate(fnHigh)).toBeLessThan(authRate(fnLow));
  });

  it('soft declines outnumber hard declines', () => {
    const declined = txns.filter((t) => t.status === 'declined');
    const soft = declined.filter((t) => t.declineCategory === 'soft').length;
    const hard = declined.filter((t) => t.declineCategory === 'hard').length;
    expect(soft).toBeGreaterThan(hard);
  });

  it('code 05 is the most common decline code', () => {
    const declined = txns.filter((t) => t.status === 'declined');
    const codeCounts = new Map<string, number>();
    for (const t of declined) {
      if (t.declineCode) codeCounts.set(t.declineCode, (codeCounts.get(t.declineCode) ?? 0) + 1);
    }
    const sorted = [...codeCounts.entries()].sort((a, b) => b[1] - a[1]);
    expect(sorted[0][0]).toBe('05');
  });
});

describe('generateTransactions — amount distribution', () => {
  const txns = makeTransactions(42, 20_000);

  it('all amounts are positive', () => {
    expect(txns.every((t) => t.amount > 0)).toBe(true);
  });

  it('majority of amounts are under $500', () => {
    const under500 = txns.filter((t) => t.amount < 500).length;
    expect(under500 / txns.length).toBeGreaterThan(0.85);
  });

  it('amounts have reasonable precision (2 decimal places)', () => {
    for (const t of txns) {
      expect(Number(t.amount.toFixed(2))).toBe(t.amount);
    }
  });
});
