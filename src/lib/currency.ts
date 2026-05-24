import { useCurrencyStore } from '../store/currency';

// Currencies that have no fractional units
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'TWD', 'HUF', 'BIF', 'GNF', 'PYG', 'UGX', 'RWF']);

function fmt(currency: string, fractionDigits: number) {
  const digits = ZERO_DECIMAL.has(currency) ? 0 : fractionDigits;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// React hook — components subscribe to currency changes and re-render automatically
export function useCurrencyFormatter() {
  const currency = useCurrencyStore((state) => state.currency);
  return {
    currency,
    format: (value: number) => fmt(currency, 2).format(value),
    formatPrecise: (value: number) => fmt(currency, 3).format(value),
  };
}

// Non-hook version for use outside React (reads current state at call time)
export function formatMoneyStatic(value: number, fractionDigits = 2): string {
  const currency = useCurrencyStore.getState().currency;
  return fmt(currency, fractionDigits).format(value);
}
