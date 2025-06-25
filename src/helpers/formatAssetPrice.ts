import { supportedNativeCurrencies } from '@/references';
import { convertAmountToNativeDisplayWorklet } from './utilities';
import { NativeCurrencyKey } from '@/entities';
import {
  equalWorklet as safeEqualWorklet,
  divWorklet as safeDivWorklet,
  greaterThanOrEqualToWorklet as safeGreaterThanOrEqualToWorklet,
  isNumberStringWorklet as safeIsNumberStringWorklet,
  lessThanWorklet as safeLessThanWorklet,
  mulWorklet as safeMulWorklet,
  orderOfMagnitudeWorklet as safeOrderOfMagnitudeWorklet,
  powWorklet as safePowWorklet,
  removeDecimalWorklet as safeRemoveDecimalWorklet,
  toFixedWorklet as safeToFixedWorklet,
  toStringWorklet as safeToStringWorklet,
} from '../safe-math/SafeMath';
import { toSubscript, toSuperscript } from './strings';

interface ThresholdConfig {
  threshold: number;
  minDecimalPlaces: number; // Minimum decimal places to show
  significantDigits?: number; // For numbers < 1, may show more decimal places to ensure this many significant digits
}

interface SubscriptThresholdConfig {
  threshold: number;
  significantDigits: number;
}

interface FormatAssetPriceParams {
  value: string | number;
  prefix?: string;
  decimalPlaces?: number; // Default decimal places if no threshold matches
  currency?: NativeCurrencyKey;
  generalThresholds?: ThresholdConfig[];
  superscriptThresholds?: ThresholdConfig[];
  subscriptThresholds?: SubscriptThresholdConfig[];
}

// Helper function to format fraction with significant digits
function formatFractionWithSignificantDigits(fractionString: string, significantDigits: number): string {
  'worklet';

  let firstNonZeroIndex = 0;
  for (let i = 0; i < fractionString.length; i++) {
    if (fractionString[i] !== '0') {
      firstNonZeroIndex = i;
      break;
    }
  }

  const leadingZeros = fractionString.substring(0, firstNonZeroIndex);
  const significantPart = fractionString.substring(firstNonZeroIndex);
  const truncatedSignificant = significantPart.substring(0, significantDigits);

  // Format with subscript for zeros count
  if (leadingZeros.length > 2) {
    const subscriptCount = leadingZeros.length
      .toString()
      .split('')
      .map(char => toSubscript(char))
      .join('');

    return `0${subscriptCount}${truncatedSignificant}`;
  }

  // If only a few leading zeros, show them normally
  return leadingZeros + truncatedSignificant;
}

// Find appropriate decimal places based on thresholds
function getDecimalPlacesFromThresholds(value: number, thresholds: ThresholdConfig[], decimalPlaces: number): number {
  'worklet';
  if (thresholds.length === 0) return decimalPlaces;

  // Sort thresholds in descending order
  const sortedThresholds = [...thresholds].sort((a, b) => b.threshold - a.threshold);

  // Find the first threshold that the value exceeds
  for (const config of sortedThresholds) {
    if (value >= config.threshold) {
      if (value < 1 && config.significantDigits) {
        // Calculate position of first significant digit
        const firstSigDigitPosition = Math.ceil(-Math.log10(value));
        // Total decimal places needed = position of first sig digit + remaining sig digits - 1
        const decimalPlacesForSigDigs = firstSigDigitPosition + config.significantDigits - 1;
        return Math.max(config.minDecimalPlaces, decimalPlacesForSigDigs);
      }
      return config.minDecimalPlaces;
    }
  }

  return sortedThresholds[sortedThresholds.length - 1]?.minDecimalPlaces ?? decimalPlaces;
}

// Helper function to get significant digits for subscript notation
function getSignificantDigitsFromThresholds(value: number, thresholds: SubscriptThresholdConfig[], defaultDigits = 4) {
  'worklet';
  if (thresholds.length === 0) return defaultDigits;

  const sortedThresholds = [...thresholds].sort((a, b) => b.threshold - a.threshold);

  for (const config of sortedThresholds) {
    if (value >= config.threshold) {
      return config.significantDigits;
    }
  }

  return sortedThresholds[sortedThresholds.length - 1]?.significantDigits ?? defaultDigits;
}

export function formatAssetPrice({
  value,
  prefix,
  currency,
  decimalPlaces = 2,
  generalThresholds = [
    { threshold: 10, minDecimalPlaces: 2 },
    { threshold: 1, minDecimalPlaces: 4 },
    { threshold: 0.0001, minDecimalPlaces: 4, significantDigits: 4 },
  ],
  superscriptThresholds = [{ threshold: 1_000_000, minDecimalPlaces: 2 }],
  subscriptThresholds = [{ threshold: 0.0001, significantDigits: 4 }],
}: FormatAssetPriceParams): string {
  'worklet';

  const valueString = safeToStringWorklet(value);
  if (!safeIsNumberStringWorklet(valueString)) return valueString ?? '';

  const numericString = valueString;
  const isNegative = safeLessThanWorklet(numericString, '0');
  const absNumericString = isNegative ? safeMulWorklet(numericString, '-1') : numericString;
  const sign = isNegative ? '-' : '';

  // Handle zero case
  if (safeEqualWorklet(absNumericString, '0')) {
    const formattedValue = safeToFixedWorklet('0', decimalPlaces);
    return prefix ? `${prefix}${formattedValue}` : `${formattedValue}`;
  }

  const magnitude = safeOrderOfMagnitudeWorklet(absNumericString);
  const absValue = parseFloat(absNumericString);

  // Handle >= 1
  if (safeGreaterThanOrEqualToWorklet(absNumericString, '1')) {
    const superscriptThreshold = superscriptThresholds[0]?.threshold ?? 1_000_000;

    if (absValue >= superscriptThreshold) {
      const divisor = safePowWorklet('10', magnitude.toString());
      const mantissa = safeDivWorklet(absNumericString, divisor);

      // Get decimal places for superscript notation
      const superscriptDecimalPlaces = getDecimalPlacesFromThresholds(absValue, superscriptThresholds, decimalPlaces);

      const formattedMantissa = safeToFixedWorklet(mantissa, superscriptDecimalPlaces);
      const superscriptExponent = `${magnitude
        .toString()
        .split('')
        .map(char => toSuperscript(char))
        .join('')}`;

      return prefix
        ? `${prefix}${sign}${formattedMantissa}×10${superscriptExponent}`
        : `${sign}${formattedMantissa}×10${superscriptExponent}`;
    }

    // Handle currency formatting
    if (currency) {
      const currencyDecimalPlaces = getDecimalPlacesFromThresholds(absValue, generalThresholds, decimalPlaces);

      const nativeDisplay = convertAmountToNativeDisplayWorklet(absNumericString, currency, false, true, currencyDecimalPlaces);

      const formattedValue = prefix === supportedNativeCurrencies[currency].symbol ? nativeDisplay.replace(prefix, '') : nativeDisplay;

      return prefix ? `${prefix}${sign}${formattedValue}` : `${sign}${formattedValue}`;
    }

    // Fixed decimal for normal range numbers
    const normalDecimalPlaces = getDecimalPlacesFromThresholds(absValue, generalThresholds, decimalPlaces);

    const formattedValue = safeToFixedWorklet(absNumericString, normalDecimalPlaces);
    return prefix ? `${prefix}${sign}${formattedValue}` : `${sign}${formattedValue}`;
  }

  // Handle < 1
  let useSubscript = false;
  let targetSignificantDigits = 4;
  let targetDecimalPlaces = decimalPlaces;

  if (subscriptThresholds.length > 0) {
    // Check against custom subscript thresholds
    const sortedSubscriptThresholds = [...subscriptThresholds].sort((a, b) => a.threshold - b.threshold);

    // Find if value is below the smallest threshold (use subscript)
    const smallestThreshold = sortedSubscriptThresholds[0].threshold;
    useSubscript = absValue < smallestThreshold;

    // For subscript notation, use significant digits
    if (useSubscript) {
      targetSignificantDigits = getSignificantDigitsFromThresholds(absValue, subscriptThresholds);
    } else {
      targetDecimalPlaces = getDecimalPlacesFromThresholds(absValue, generalThresholds, decimalPlaces);
    }
  }

  if (!useSubscript) {
    const formattedValue = safeToFixedWorklet(absNumericString, targetDecimalPlaces);

    return prefix ? `${prefix}${sign}${formattedValue}` : `${sign}${formattedValue}`;
  } else {
    const [bigIntNum, fractionDecimalPlaces] = safeRemoveDecimalWorklet(absNumericString);
    let fullFractionString = '';

    if (fractionDecimalPlaces > 0) {
      const positiveBigIntStr = (bigIntNum < 0n ? -bigIntNum : bigIntNum).toString();
      fullFractionString = positiveBigIntStr.padStart(fractionDecimalPlaces, '0');
    } else {
      fullFractionString = (bigIntNum < 0n ? -bigIntNum : bigIntNum).toString();
    }

    const formattedFraction = formatFractionWithSignificantDigits(fullFractionString, targetSignificantDigits);

    return prefix ? `${prefix}${sign}0.${formattedFraction}` : `${sign}0.${formattedFraction}`;
  }
}
