import {
  ceilWorklet,
  divWorklet,
  floorWorklet,
  mulWorklet,
  roundWorklet,
  toFixedWorklet,
  orderOfMagnitudeWorklet,
  significantDecimalsWorklet,
} from '@/safe-math/SafeMath';

const MAXIMUM_SIGNIFICANT_DECIMALS = 6;
const STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS = 2;

export function valueBasedDecimalFormatter({
  amount,
  isStablecoin,
  nativePrice,
  niceIncrementMinimumDecimals,
  precisionAdjustment,
  roundingMode,
  stripSeparators = true,
}: {
  amount: number | string;
  isStablecoin?: boolean;
  nativePrice: number;
  niceIncrementMinimumDecimals?: number;
  precisionAdjustment?: number;
  roundingMode?: 'up' | 'down' | 'none';
  stripSeparators?: boolean;
}): string {
  'worklet';

  function calculateDecimalPlaces(): {
    minimumDecimalPlaces: number;
    maximumDecimalPlaces: number;
  } {
    const orderOfMagnitude = orderOfMagnitudeWorklet(amount);
    const minDecimalsForOneCent = nativePrice ? Math.round(Math.max(0, Math.log10(nativePrice / 0.01))) : MAXIMUM_SIGNIFICANT_DECIMALS;

    const significantDecimals = significantDecimalsWorklet(amount);

    let minimumDecimalPlaces = 0;
    let maximumDecimalPlaces = MAXIMUM_SIGNIFICANT_DECIMALS;
    const stablecoinMin = isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0;

    const minBasedOnOrderOfMag = orderOfMagnitude > 2 ? 0 : 2;
    if (orderOfMagnitude < 1) {
      minimumDecimalPlaces = Math.max(stablecoinMin, significantDecimals);
      maximumDecimalPlaces = Math.max(minBasedOnOrderOfMag, minDecimalsForOneCent, significantDecimals + 1);
    } else {
      minimumDecimalPlaces = stablecoinMin;
      maximumDecimalPlaces = Math.max(minBasedOnOrderOfMag, minDecimalsForOneCent - orderOfMagnitude);
    }

    return {
      minimumDecimalPlaces,
      maximumDecimalPlaces: Math.max(
        maximumDecimalPlaces + (precisionAdjustment ?? 0),
        niceIncrementMinimumDecimals ? niceIncrementMinimumDecimals + 1 : 0,
        minimumDecimalPlaces
      ),
    };
  }

  const { minimumDecimalPlaces, maximumDecimalPlaces } = calculateDecimalPlaces();

  let roundedAmount;
  const factor = Math.pow(10, maximumDecimalPlaces) || 1; // Prevent division by 0

  // Apply rounding based on the specified rounding mode
  if (roundingMode === 'up') {
    roundedAmount = divWorklet(ceilWorklet(mulWorklet(amount, factor)), factor);
  } else if (roundingMode === 'down') {
    roundedAmount = divWorklet(floorWorklet(mulWorklet(amount, factor)), factor);
  } else if (roundingMode === 'none') {
    roundedAmount = toFixedWorklet(amount, maximumDecimalPlaces);
  } else {
    // Default to normal rounding if no rounding mode is specified
    roundedAmount = divWorklet(roundWorklet(mulWorklet(amount, factor)), factor);
  }
  // Format the number to add separators and trim trailing zeros
  const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minimumDecimalPlaces,
    maximumFractionDigits: maximumDecimalPlaces || 0,
    useGrouping: !stripSeparators,
  });

  return numberFormatter.format(Number(roundedAmount));
}
