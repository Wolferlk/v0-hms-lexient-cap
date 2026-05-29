export type BoatRideCurrency = 'LKR' | 'USD' | 'INR' | 'AUD' | 'SAR' | 'CNY' | 'JPY';

export const BOAT_RIDE_CURRENCIES: BoatRideCurrency[] = [
  'LKR',
  'USD',
  'INR',
  'AUD',
  'SAR',
  'CNY',
  'JPY',
];

export const BOAT_RIDE_CURRENCY_LABELS: Record<BoatRideCurrency, string> = {
  LKR: '🇱🇰 LKR — Sri Lankan Rupee (Locals)',
  USD: '🇺🇸 USD — US Dollar',
  INR: '🇮🇳 INR — Indian Rupee',
  AUD: '🇦🇺 AUD — Australian Dollar',
  SAR: '🇸🇦 SAR — Saudi Riyal',
  CNY: '🇨🇳 CNY — Chinese Yuan',
  JPY: '🇯🇵 JPY — Japanese Yen',
};
