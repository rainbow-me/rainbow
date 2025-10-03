import { getNumberFormatter } from '@/helpers/intl';
import {
  isNumberStringWorklet,
  toFixedWorklet,
  trimTrailingZeros,
  lessThanWorklet,
  greaterThanOrEqualToWorklet,
  divWorklet,
  toStringWorklet,
} from '@/safe-math/SafeMath';

// There are many other formatCurrency functions, but this is simplified for hyperliquid which is all USD
export function formatCurrency(
  value: string,
  options: {
    minValue?: number;
    decimals?: number;
    useCompactNotation?: boolean;
  } = {}
): string {
  'worklet';

  const { minValue = 0, decimals = 2, useCompactNotation = false } = options;

  if (!isNumberStringWorklet(value)) {
    return '$0';
  }

  const numValue = Number(value);
  const absValueStr = toStringWorklet(Math.abs(numValue));
  const minValueStr = toStringWorklet(minValue);

  // Handle values below minimum
  if (minValue > 0 && lessThanWorklet(absValueStr, minValueStr)) {
    if (numValue === 0) {
      return '$0';
    }
    return numValue > 0 ? `<$${minValue}` : `>-$${minValue}`;
  }

  const isNegative = numValue < 0;

  let formattedValue: string;
  let suffix = '';

  // Apply compact notation for large numbers
  if (useCompactNotation) {
    if (greaterThanOrEqualToWorklet(absValueStr, '1000000000000')) {
      const divided = divWorklet(absValueStr, '1000000000000');
      formattedValue = toFixedWorklet(divided, decimals);
      suffix = 'T';
    } else if (greaterThanOrEqualToWorklet(absValueStr, '1000000000')) {
      const divided = divWorklet(absValueStr, '1000000000');
      formattedValue = toFixedWorklet(divided, decimals);
      suffix = 'B';
    } else if (greaterThanOrEqualToWorklet(absValueStr, '1000000')) {
      const divided = divWorklet(absValueStr, '1000000');
      formattedValue = toFixedWorklet(divided, decimals);
      suffix = 'M';
    } else if (greaterThanOrEqualToWorklet(absValueStr, '1000')) {
      const divided = divWorklet(absValueStr, '1000');
      formattedValue = toFixedWorklet(divided, decimals);
      suffix = 'K';
    } else {
      const formatter = getNumberFormatter('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: true,
      });
      formattedValue = formatter.format(parseFloat(absValueStr));
    }
  } else {
    const formatter = getNumberFormatter('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    });
    formattedValue = formatter.format(parseFloat(absValueStr));
  }

  if (suffix && decimals > 0) {
    formattedValue = trimTrailingZeros(formattedValue);
  }

  return `${isNegative ? '-' : ''}$${formattedValue}${suffix}`;
}
