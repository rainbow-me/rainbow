import {
  ceilWorklet,
  divWorklet,
  floorWorklet,
  mulWorklet,
  roundWorklet,
  toFixedWorklet,
  orderOfMagnitudeWorklet,
  significantDecimalsWorklet,
} from '../safe-math/SafeMath';

const MAXIMUM_SIGNIFICANT_DECIMALS = 6;
const STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS = 2;

export function valueBasedDecimalFormatter({
  amount,
  nativePrice,
  roundingMode,
  precisionAdjustment,
  isStablecoin,
  stripSeparators = true,
}: {
  amount: number | string;
  nativePrice: number;
  roundingMode?: 'up' | 'down' | 'none';
  precisionAdjustment?: number;
  isStablecoin?: boolean;
  stripSeparators?: boolean;
}): string {
  'worklet';

  function calculateDecimalPlaces(): {
    minimumDecimalPlaces: number;
    maximumDecimalPlaces: number;
  } {
    const orderOfMagnitude = orderOfMagnitudeWorklet(amount);
    let minDecimalsForOneCent = nativePrice ? Math.round(Math.max(0, Math.log10(nativePrice / 0.01))) : MAXIMUM_SIGNIFICANT_DECIMALS;

    const significantDecimals = significantDecimalsWorklet(amount);

    let minimumDecimalPlaces = 0;
    let maximumDecimalPlaces = MAXIMUM_SIGNIFICANT_DECIMALS;

    if (orderOfMagnitude < 1) {
      minimumDecimalPlaces = Math.max(isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0, significantDecimals);
      maximumDecimalPlaces = Math.max(Math.max(minDecimalsForOneCent, 2), significantDecimals + 1, minimumDecimalPlaces);
    } else if (orderOfMagnitude >= 0 && orderOfMagnitude <= 2) {
      minimumDecimalPlaces = Math.max(isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0, significantDecimals);
      maximumDecimalPlaces = Math.max(minDecimalsForOneCent - orderOfMagnitude, significantDecimals + 1, minimumDecimalPlaces);
    } else {
      minimumDecimalPlaces = isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0;
      maximumDecimalPlaces = Math.max(0, minDecimalsForOneCent - orderOfMagnitude, minimumDecimalPlaces);
    }

    return {
      minimumDecimalPlaces,
      maximumDecimalPlaces: maximumDecimalPlaces + (precisionAdjustment ?? 0),
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
    maximumFractionDigits: maximumDecimalPlaces,
    useGrouping: !stripSeparators,
  });

  return numberFormatter.format(Number(roundedAmount));
}
