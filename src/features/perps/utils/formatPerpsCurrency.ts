import { getNumberFormatter } from '@/helpers/intl';
import { formatOrderPrice } from './formatOrderPrice';

/**
 * Format a value as currency using Hyperliquid's precision rules
 */
export function formatPerpAssetPrice(
  value: string,
  options: {
    sizeDecimals?: number;
    marketType?: 'perp' | 'spot';
    locale?: string;
  } = {}
): string {
  'worklet';

  const { sizeDecimals = 0, marketType = 'perp', locale = 'en-US' } = options;

  // Use formatOrderPrice to get the correctly formatted number with proper precision
  const formattedNumber = formatOrderPrice({
    price: value,
    sizeDecimals,
    marketType,
  });

  if (!formattedNumber) {
    return '$0';
  }

  const numValue = Number(formattedNumber);
  const isNegative = numValue < 0;

  // Count decimal places in the formatted number
  const decimalPlaces = formattedNumber.includes('.') ? formattedNumber.split('.')[1].length : 0;

  // Use number formatter for proper localization (handles European vs US formatting)
  const formatter = getNumberFormatter(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: true,
  });

  const localizedNumber = formatter.format(Math.abs(numValue));
  return `${isNegative ? '-' : ''}$${localizedNumber}`;
}
