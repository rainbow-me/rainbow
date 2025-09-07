import {
  isNumberStringWorklet,
  orderOfMagnitudeWorklet,
  removeDecimalWorklet,
  significantDecimalsWorklet,
  toFixedWorklet,
  trimTrailingZeros,
} from '@/safe-math/SafeMath';

// Logic defined here: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size
const MAX_SIG_FIGS = 5;
const MAX_DECIMALS_PERP = 6;
const MAX_DECIMALS_SPOT = 8;

function isInteger(rawBigInt: bigint, decimalPlaces: number): boolean {
  if (decimalPlaces <= 0) return true;
  const divisor = BigInt(10) ** BigInt(decimalPlaces);
  return rawBigInt % divisor === 0n;
}

function calculateDecimalsForSignificantFigures(input: string): number {
  const magnitude = orderOfMagnitudeWorklet(input);

  if (magnitude >= 0) {
    // x >= 1: integer digits = magnitude + 1
    const integerDigits = magnitude + 1;
    return integerDigits >= MAX_SIG_FIGS ? 0 : MAX_SIG_FIGS - integerDigits;
  }

  // 0 < x < 1: include leading zeros before first significant digit
  const firstSignificantPosition = significantDecimalsWorklet(input);
  return firstSignificantPosition + MAX_SIG_FIGS - 1;
}

export function formatOrderPrice({
  price,
  sizeDecimals,
  marketType,
}: {
  price: string;
  sizeDecimals: number;
  marketType: 'perp' | 'spot';
}): string {
  const input = (price ?? '').toString().trim();

  if (!input || !isNumberStringWorklet(input)) {
    return '';
  }

  const maxDecimals = marketType === 'perp' ? MAX_DECIMALS_PERP : MAX_DECIMALS_SPOT;
  const allowedDecimals = Math.max(0, maxDecimals - (sizeDecimals ?? 0));

  const [rawBigInt, decimalPlaces] = removeDecimalWorklet(input);
  if (isInteger(rawBigInt, decimalPlaces)) {
    return trimTrailingZeros(toFixedWorklet(input, 0));
  }

  // Calculate decimals needed for significant figures
  const decimalsForSigFigs = calculateDecimalsForSignificantFigures(input);
  const decimalsToUse = Math.min(allowedDecimals, Math.max(0, decimalsForSigFigs));

  return trimTrailingZeros(toFixedWorklet(input, decimalsToUse));
}
