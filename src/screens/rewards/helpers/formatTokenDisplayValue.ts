import { getNumberFormatter } from '@/helpers/intl';

export function formatTokenDisplayValue(tokenValue: number, tokenSymbol: string): string {
  const formattedValue = getNumberFormatter('en-US', { maximumFractionDigits: 2 }).format(tokenValue);
  return `${formattedValue} ${tokenSymbol}`;
}
