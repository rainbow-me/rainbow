import { formatNumber } from '@/helpers/strings';

const upSymbol = '↑';
const downSymbol = '-';

export const formatPriceChange = (relativeChange?: number | null): string => {
  if (!relativeChange && relativeChange !== 0) {
    return 'N/A';
  }
  const isPositive = relativeChange > 0;
  const symbol = isPositive ? upSymbol : downSymbol;
  const formattedNumber = formatNumber(Math.abs(relativeChange), { decimals: 2, useOrderSuffix: true });
  return `${symbol} ${formattedNumber}%`;
};

export const getPriceChangeColor = (priceChange: string) => {
  if (priceChange === 'N/A') {
    return 'labelQuaternary';
  }
  return priceChange.startsWith(upSymbol) ? 'green' : 'labelQuaternary';
};
