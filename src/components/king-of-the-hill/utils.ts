import { formatNumber } from '@/helpers/strings';

export const formatPriceChange = (relativeChange?: number | null): string => {
  if (!relativeChange && relativeChange !== 0) {
    return 'N/A';
  }
  const isPositive = relativeChange > 0;
  const symbol = isPositive ? `↑` : `-`;
  const formattedNumber = formatNumber(relativeChange, { decimals: 2, useOrderSuffix: true });
  return `${symbol} ${formattedNumber}%`;
};

export const getPriceChangeColor = (priceChange: string) => {
  if (priceChange === 'N/A') {
    return 'labelQuaternary';
  }
  return priceChange.startsWith('↑') ? 'green' : 'labelQuaternary';
};
