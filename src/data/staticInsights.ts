import { Insight } from '@/types';

/**
 * Pre-generated demo insights for seed=42, 50K transactions, 90-day window.
 * These are shown by default in demo mode to avoid live API calls.
 * To restore live generation, set DEMO_MODE = false in src/config.ts.
 */
export const STATIC_INSIGHTS: Insight[] = [
  {
    id: 'static_insight_1',
    category: 'tokenization',
    title: 'Network Tokenization Coverage Gap',
    description:
      'Raw PAN transactions account for roughly 40% of volume but authorize at only 91.2% — a 5.9-point gap versus the 97.1% rate seen on network tokens. The gap is most pronounced on one-time transactions, where PAN usage is highest and fraud scoring is strictest.',
    currentMetric: 'Raw PAN auth rate: 91.2% (40% of volume)',
    projectedMetric: 'Network token rate: 97.1% — closing 50% of gap → ~94.2%',
    estimatedImpact: '~$218K monthly revenue recovery',
    action:
      'Prioritize network token enrollment via your payment processor for the top-20 BINs by declined PAN volume. Most major processors offer automated token migration — target the 480837 and 558282 BIN ranges first (First National, high volume).',
    confidence: 'high',
    supportingData:
      'Network token: 97.1% auth rate (12,340 txns) | PSP token: 93.4% (17,820 txns) | Raw PAN: 91.2% (19,840 txns). Delta is consistent across card brands and amount bands.',
  },
  {
    id: 'static_insight_2',
    category: 'issuer_specific',
    title: 'First National Anomalous Decline Rate on High-Value Transactions',
    description:
      'First National Bank shows a 78.4% auth rate on transactions above $200 — 14.6 points below the portfolio average for the same amount band. Code 05 (Do Not Honor) accounts for 61% of their declines in this segment, suggesting conservative fraud scoring rules rather than genuine account issues.',
    currentMetric: 'First National $200+ auth rate: 78.4%',
    projectedMetric: 'Portfolio average for $200+ segment: 85.2%',
    estimatedImpact: '~$94K monthly if resolved to segment average',
    action:
      'Request a meeting with your First National relationship manager to share decline data. Provide velocity context — if these are legitimate recurring customers, request a fraud-model parameter adjustment for your MID. As a stopgap, consider downgrading high-value First National transactions to a lower amount split-tender approach.',
    confidence: 'high',
    supportingData:
      'First National $200+ txns: 2,841 total, 614 declines. Code 05: 374 declines (61%). Same BINs on <$200 transactions show 92.1% auth rate, isolating the amount threshold.',
  },
  {
    id: 'static_insight_3',
    category: 'retry_logic',
    title: 'Soft Decline Recovery Opportunity',
    description:
      'Soft declines (codes 05, 51, 61, 65) represent 59% of all decline volume — these are retryable, and the data shows they\'re currently not being retried systematically. A 30% retry recovery rate on soft declines — a conservative industry benchmark — would recover roughly 1,770 transactions per month.',
    currentMetric: 'Soft decline count: 5,920/month | No retry observed in data',
    projectedMetric: 'At 30% recovery rate: 1,776 additional approvals',
    estimatedImpact: '~$151K monthly revenue recovery',
    action:
      'Implement intelligent retry logic: wait 24h before retrying code 05, retry code 51 after end-of-month (funds replenishment), retry code 65 after 72h. Cap at 2 retry attempts per transaction. Use network tokens on retries for a compounding uplift effect.',
    confidence: 'high',
    supportingData:
      'Code 05: 1,774 declines (30% of total) | Code 51: 1,183 declines (20%) | Code 61: 296 declines (5%) | Code 65: 296 declines (5%). All categorized soft — retryable per Visa/MC rules.',
  },
  {
    id: 'static_insight_4',
    category: '3ds_optimization',
    title: '3DS Challenge Rate Creating Auth Rate Drag',
    description:
      'Transactions that go through 3DS challenge flow authorize at 88.3% — 6.7 points below frictionless (95.0%). Challenged transactions represent 20% of volume. Shifting even half of unnecessary challenges to frictionless via risk-based authentication tuning would materially improve overall portfolio rate.',
    currentMetric: 'Challenged 3DS auth rate: 88.3% (20% of volume)',
    projectedMetric: 'Frictionless auth rate: 95.0% — shifting 50% of challenged to frictionless → +1.3% overall',
    estimatedImpact: '~$110K monthly revenue recovery',
    action:
      'Work with your 3DS provider to tighten the challenge trigger thresholds — specifically, whitelist returning customers with 90+ day purchase history and CVV match. Evaluate EMV 3DS 2.x device fingerprinting to generate lower-risk scores for recognized devices. Target: reduce challenge rate from 20% to 10%.',
    confidence: 'medium',
    supportingData:
      'Frictionless: 95.0% auth (20,140 txns) | Challenged: 88.3% (10,060 txns) | Not enrolled: 90.1% (12,580 txns). Challenge rate is disproportionately high on recurring transactions that could be whitelisted.',
  },
  {
    id: 'static_insight_5',
    category: 'fraud_tuning',
    title: 'Prepaid Card Segment Dragging Portfolio Rate',
    description:
      'Prepaid cards authorize at 85.1% — 8 points below credit cards — and represent ~10% of volume. The prepaid decline profile skews heavily toward code 51 (insufficient funds) and code 14 (invalid card number), suggesting a combination of balance issues and card degradation rather than systematic fraud. International prepaid is particularly problematic at 76.3%.',
    currentMetric: 'Prepaid auth rate: 85.1% | International prepaid: 76.3%',
    projectedMetric: 'Excluding international prepaid from acceptance → +0.4% overall rate',
    estimatedImpact: '~$42K monthly (rate improvement) or significant fraud reduction',
    action:
      'Consider geo-restricting prepaid card acceptance for international transactions (domestic prepaid is more defensible at 87.4%). For domestic prepaid, implement a real-time balance verification pre-auth where your processor supports it. Separately, investigate the card 14 (invalid card number) cluster — it may indicate a compromised BIN range.',
    confidence: 'medium',
    supportingData:
      'Prepaid domestic: 87.4% auth (3,910 txns) | Prepaid international: 76.3% (1,090 txns). Code 51 accounts for 34% of prepaid declines vs 20% overall. Code 14 is 3× more prevalent on prepaid vs credit.',
  },
  {
    id: 'static_insight_6',
    category: 'routing',
    title: 'MOTO Channel Underperforming — Routing Review Warranted',
    description:
      'Mail Order / Telephone Order (MOTO) transactions authorize at 89.1% — 4 points below card-on-file and 7 points below recurring. MOTO has the highest exposure to code 59 (suspected fraud) at 2× the portfolio rate, likely because MOTO transactions lack device fingerprint and 3DS data that issuers use for risk scoring.',
    currentMetric: 'MOTO auth rate: 89.1% (10% of volume)',
    projectedMetric: 'Card-on-file rate: 96.3% — migrating MOTO to COF credentials → +7.2% on segment',
    estimatedImpact: '~$63K monthly revenue recovery',
    action:
      'Audit whether MOTO transactions can be migrated to card-on-file credentials: if the customer has an existing account, store their card and charge as COF rather than MOTO. For true MOTO (phone orders with no prior account), ensure you\'re sending the maximum customer data fields in the auth request — particularly billing address and AVS — to give issuers more scoring signal.',
    confidence: 'medium',
    supportingData:
      'MOTO: 89.1% auth (4,970 txns) | Recurring: 96.2% (15,040 txns) | COF: 96.3% (9,920 txns). Code 59 rate on MOTO: 3.1% vs 1.4% portfolio average.',
  },
  {
    id: 'static_insight_7',
    category: 'general',
    title: 'Late-Night Transaction Window Shows Elevated Decline Rate',
    description:
      'Transactions between 2–5 AM show a 1.8–2.4% lower auth rate than daytime averages. This is consistent with tighter issuer fraud scoring during off-hours when human review is less available. The effect is most pronounced on amounts above $100 and on international transactions during this window.',
    currentMetric: '2–5 AM auth rate: 91.1% vs daytime average: 93.6%',
    projectedMetric: 'Scheduling deferred batch jobs outside 2–5 AM window → +2.5% on batch volume',
    estimatedImpact: '~$28K monthly (if batch transactions can be rescheduled)',
    action:
      'If you run subscription billing or batch charges, shift them to the 10 AM–2 PM window when issuer approval rates peak. For real-time transactions in this window, ensure retry logic is active — a declined 3 AM charge that retries at 7 AM has significantly higher recovery probability.',
    confidence: 'low',
    supportingData:
      '2–5 AM: 91.1% auth across 5,840 transactions. Effect size: -2.5% on $100+ amounts, -3.1% on international. Daytime (10 AM–2 PM) peak: 94.1% across 8,120 transactions.',
  },
];
