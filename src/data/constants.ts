export const ISSUERS = [
  'Chase Bank',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'Capital One',
  'US Bancorp',
  'First National',      // anomalously high decline rate on >$200
  'TD Bank',
  'Truist',
  'PNC Bank',
  'HSBC',
  'Barclays',
  'Goldman Sachs',
  'American Express',
  'Discover Financial',
  'Navy Federal',
  'Ally Bank',
  'Synchrony',
  'Bread Financial',
  'Credit One',
] as const;

export const BIN_RANGES: Record<string, { brand: 'visa' | 'mastercard' | 'amex' | 'discover'; issuer: string }> = {
  '411111': { brand: 'visa', issuer: 'Chase Bank' },
  '424242': { brand: 'visa', issuer: 'Bank of America' },
  '450875': { brand: 'visa', issuer: 'Wells Fargo' },
  '462285': { brand: 'visa', issuer: 'Citibank' },
  '471105': { brand: 'visa', issuer: 'Capital One' },
  '476148': { brand: 'visa', issuer: 'US Bancorp' },
  '480837': { brand: 'visa', issuer: 'First National' },
  '486096': { brand: 'visa', issuer: 'TD Bank' },
  '510510': { brand: 'mastercard', issuer: 'Chase Bank' },
  '520082': { brand: 'mastercard', issuer: 'Bank of America' },
  '530101': { brand: 'mastercard', issuer: 'Citibank' },
  '540141': { brand: 'mastercard', issuer: 'Capital One' },
  '550000': { brand: 'mastercard', issuer: 'Truist' },
  '553262': { brand: 'mastercard', issuer: 'PNC Bank' },
  '558282': { brand: 'mastercard', issuer: 'First National' },
  '371449': { brand: 'amex', issuer: 'American Express' },
  '378282': { brand: 'amex', issuer: 'American Express' },
  '341111': { brand: 'amex', issuer: 'Goldman Sachs' },
  '601100': { brand: 'discover', issuer: 'Discover Financial' },
  '644060': { brand: 'discover', issuer: 'Discover Financial' },
};

export const DECLINE_CODES: Record<string, { name: string; category: 'soft' | 'hard'; weight: number }> = {
  '05': { name: 'Do Not Honor', category: 'soft', weight: 30 },
  '51': { name: 'Insufficient Funds', category: 'soft', weight: 20 },
  '14': { name: 'Invalid Card Number', category: 'hard', weight: 8 },
  '54': { name: 'Expired Card', category: 'hard', weight: 7 },
  '61': { name: 'Exceeds Withdrawal Limit', category: 'soft', weight: 5 },
  '65': { name: 'Activity Limit Exceeded', category: 'soft', weight: 5 },
  '41': { name: 'Lost Card', category: 'hard', weight: 4 },
  '43': { name: 'Stolen Card', category: 'hard', weight: 3 },
  'N7': { name: 'CVV Mismatch', category: 'hard', weight: 6 },
  '59': { name: 'Suspected Fraud', category: 'hard', weight: 5 },
  'OTHER': { name: 'Other / Unspecified', category: 'soft', weight: 7 },
};

export const COUNTRIES = [
  { code: 'US', weight: 55, domestic: true },
  { code: 'CA', weight: 8, domestic: false },
  { code: 'GB', weight: 7, domestic: false },
  { code: 'DE', weight: 5, domestic: false },
  { code: 'FR', weight: 5, domestic: false },
  { code: 'AU', weight: 4, domestic: false },
  { code: 'JP', weight: 3, domestic: false },
  { code: 'BR', weight: 3, domestic: false },
  { code: 'MX', weight: 3, domestic: false },
  { code: 'IN', weight: 4, domestic: false },
  { code: 'SG', weight: 2, domestic: false },
  { code: 'NL', weight: 1, domestic: false },
];

export const MERCHANT_CATEGORY_CODES = [
  '5411', // Grocery stores
  '5812', // Eating places
  '5732', // Electronics
  '5912', // Drug stores
  '7011', // Hotels
  '4111', // Transportation
  '5945', // Hobby/toy stores
  '7372', // Computer services
  '5999', // Retail stores
  '6300', // Insurance
];

export const AMOUNT_BANDS = [
  { label: '$0–25', min: 0, max: 25 },
  { label: '$25–100', min: 25, max: 100 },
  { label: '$100–500', min: 100, max: 500 },
  { label: '$500+', min: 500, max: Infinity },
];

export const AUTH_RATE_TARGET = 93;

export const DIMENSION_LABELS: Record<string, string> = {
  cardBrand: 'Card Brand',
  cardType: 'Card Type',
  transactionType: 'Transaction Type',
  tokenType: 'Token Type',
  threeDSStatus: '3DS Status',
  isDomestic: 'Domestic vs International',
  amountBand: 'Amount Band',
  issuer: 'Top 10 Issuers',
  declineCode: 'Top 10 Decline Codes',
};

export const VALUE_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  credit: 'Credit',
  debit: 'Debit',
  prepaid: 'Prepaid',
  one_time: 'One-time',
  recurring: 'Recurring',
  card_on_file: 'Card on File',
  moto: 'MOTO',
  pan: 'Raw PAN',
  psp_token: 'PSP Token',
  network_token: 'Network Token',
  challenged: 'Challenged',
  frictionless: 'Frictionless',
  not_enrolled: 'Not Enrolled',
  na: 'N/A',
  true: 'Domestic',
  false: 'International',
};
