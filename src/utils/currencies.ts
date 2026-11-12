import { CurrencyConfig, BillingCycle } from '../types/subscription';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRateToUSD: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', exchangeRateToUSD: 1.08 },
  { code: 'GBP', symbol: '£', name: 'British Pound', exchangeRateToUSD: 1.28 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', exchangeRateToUSD: 0.75 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', exchangeRateToUSD: 0.65 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', exchangeRateToUSD: 0.72 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', exchangeRateToUSD: 0.0065 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', exchangeRateToUSD: 0.24 },
];

export function getCurrencyConfig(code: string): CurrencyConfig {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) ||
    SUPPORTED_CURRENCIES[0]
  );
}

/**
 * Normalizes subscription cost to monthly equivalent
 */
export function getMonthlyEquivalent(cost: number, cycle: BillingCycle): number {
  if (cost <= 0) return 0;
  switch (cycle) {
    case 'weekly':
      return (cost * 52) / 12;
    case 'monthly':
      return cost;
    case 'quarterly':
      return cost / 3;
    case 'semi-annually':
      return cost / 6;
    case 'annually':
      return cost / 12;
    default:
      return cost;
  }
}

/**
 * Normalizes subscription cost to annual equivalent
 */
export function getAnnualEquivalent(cost: number, cycle: BillingCycle): number {
  if (cost <= 0) return 0;
  switch (cycle) {
    case 'weekly':
      return cost * 52;
    case 'monthly':
      return cost * 12;
    case 'quarterly':
      return cost * 4;
    case 'semi-annually':
      return cost * 2;
    case 'annually':
      return cost;
    default:
      return cost * 12;
  }
}

/**
 * Converts an amount from source currency to target currency
 */
export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  if (fromCode.toUpperCase() === toCode.toUpperCase()) return amount;
  const fromConfig = getCurrencyConfig(fromCode);
  const toConfig = getCurrencyConfig(toCode);
  
  // Convert from source to USD, then USD to target
  const amountInUSD = amount * fromConfig.exchangeRateToUSD;
  const amountInTarget = amountInUSD / toConfig.exchangeRateToUSD;
  return amountInTarget;
}

/**
 * Formats a currency amount with its native or preferred symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options?: { hideDecimalsIfZero?: boolean; showCode?: boolean }
): string {
  const config = getCurrencyConfig(currencyCode);
  const isJpy = currencyCode.toUpperCase() === 'JPY';
  
  let formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: isJpy ? 0 : options?.hideDecimalsIfZero && amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: isJpy ? 0 : 2,
  });

  if (options?.showCode) {
    return `${config.symbol}${formattedNumber} ${config.code}`;
  }
  return `${config.symbol}${formattedNumber}`;
}
