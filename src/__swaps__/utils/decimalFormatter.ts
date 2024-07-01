import {
  ceilWorklet,
  divWorklet,
  floorWorklet,
  mulWorklet,
  roundWorklet,
  toFixedWorklet,
  orderOfMagnitudeWorklet,
} from '../safe-math/SafeMath';

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
    const decimalsBasedOnMagnitude = orderOfMagnitude > 0 ? 7 - orderOfMagnitude : -(orderOfMagnitude + 1);

    if (nativePrice === 0) {
      return {
        minimumDecimalPlaces: Math.max(-orderOfMagnitude, isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0),
        maximumDecimalPlaces: decimalsBasedOnMagnitude, // MAXIMUM_SIGNIFICANT_DECIMALS
      };
    }

    // for when it has prices, it doesn't need to be much MORE than the $0.01 granularity
    const significantDigits = 0;
    const minimumDecimalPlaces = Math.max(significantDigits, isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0);

    // for when it has a super tiny price...can we treat it the same as when it has no price?
    let minDecimalsForOneCent = 0;
    const unitsForOneCent = 0.01 / nativePrice;
    if (unitsForOneCent >= 1) {
      return {
        minimumDecimalPlaces: 0,
        maximumDecimalPlaces: 0,
      };
    } else {
      // asset nativePrice > 0.01
      minDecimalsForOneCent = Math.ceil(Math.log10(1 / unitsForOneCent));
    }
    // when precisionAdjustment is negative, it means that the order of magnitude is large
    // when precisionAdjustment is positive, it means that there are significant digits
    const maximumDecimalPlaces = Math.max(
      minDecimalsForOneCent + (precisionAdjustment ?? 0), // Math.ceil(Math.log10(1 / unitsForOneCent)) + (precisionAdjustment ?? 0),
      isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0
    );

    return {
      minimumDecimalPlaces,
      maximumDecimalPlaces, // TODO JIN - asset.decimals
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
