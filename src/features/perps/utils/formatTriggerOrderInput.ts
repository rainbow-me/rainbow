import { MAX_SIG_FIGS, MAX_DECIMALS_PERP, MAX_DECIMALS_SPOT } from '@/features/perps/constants';

/**
 * Formats trigger order price input according to Hyperliquid's decimal precision rules
 * Logic defined here: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size
 */
export function formatTriggerOrderInput(text: string, sizeDecimals: number, marketType: 'perp' | 'spot' = 'perp'): string {
  'worklet';

  // Normalize locale decimal separators (e.g., "0,001" -> "0.001")
  const normalized = text.replace(/,/g, '.');
  const cleanedText = normalized.replace(/[^0-9.]/g, '');

  if (!cleanedText) return '';

  const parts = cleanedText.split('.');
  const hasDecimal = parts.length > 1;
  const integerPart = parts[0] || '0';
  const decimalPart = hasDecimal ? parts.slice(1).join('') : '';

  const cleanedInteger = integerPart === '' ? '0' : integerPart.replace(/^0+/, '') || '0';

  const maxDecimals = marketType === 'perp' ? MAX_DECIMALS_PERP : MAX_DECIMALS_SPOT;
  const allowedDecimals = Math.max(0, maxDecimals - (sizeDecimals ?? 0));

  if (!hasDecimal) {
    return cleanedInteger;
  }

  const truncatedDecimal = decimalPart.slice(0, allowedDecimals);

  const isEffectivelyInteger = !truncatedDecimal || /^0+$/.test(truncatedDecimal);

  if (isEffectivelyInteger) {
    // Integer prices are always allowed regardless of significant figures
    return truncatedDecimal ? `${cleanedInteger}.${truncatedDecimal}` : `${cleanedInteger}.`;
  }

  const fullNumber = `${cleanedInteger}.${truncatedDecimal}`;

  const sigFigs = countSignificantFigures(cleanedInteger, truncatedDecimal);

  if (sigFigs <= MAX_SIG_FIGS) {
    return fullNumber;
  }

  return truncateToSignificantFigures(cleanedInteger, truncatedDecimal, MAX_SIG_FIGS);
}

function countSignificantFigures(integerPart: string, decimalPart: string): number {
  'worklet';

  if (integerPart !== '0') {
    return integerPart.length + decimalPart.length;
  }

  let firstNonZero = -1;
  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] !== '0') {
      firstNonZero = i;
      break;
    }
  }

  if (firstNonZero === -1) {
    return 0;
  }

  return decimalPart.length - firstNonZero;
}

function truncateToSignificantFigures(integerPart: string, decimalPart: string, maxSigFigs: number): string {
  'worklet';

  if (integerPart !== '0') {
    const intDigits = integerPart.length;

    if (intDigits >= maxSigFigs) {
      return integerPart;
    }

    const remainingSigFigs = maxSigFigs - intDigits;
    const truncatedDecimal = decimalPart.slice(0, remainingSigFigs);
    return `${integerPart}.${truncatedDecimal}`;
  }

  let firstNonZero = -1;
  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] !== '0') {
      firstNonZero = i;
      break;
    }
  }

  if (firstNonZero === -1) {
    return `0.${decimalPart}`;
  }

  const endPos = firstNonZero + maxSigFigs;
  const truncatedDecimal = decimalPart.slice(0, endPos);
  return `0.${truncatedDecimal}`;
}
