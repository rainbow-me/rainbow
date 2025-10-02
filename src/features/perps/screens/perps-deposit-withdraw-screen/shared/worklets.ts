import { SLIDER_MAX, SLIDER_MIN } from '@/features/perps/components/Slider/Slider';
import { handleSignificantDecimalsWorklet } from '@/helpers/utilities';
import {
  divWorklet,
  equalWorklet,
  lessThanWorklet,
  mulWorklet,
  orderOfMagnitudeWorklet,
  toFixedWorklet,
  truncateToDecimals,
} from '@/safe-math/SafeMath';
import { clamp } from '@/worklets/numbers';
import { sanitizeAmount } from '@/worklets/strings';

// ============ Slider Worklets ================================================ //

export function clampSliderProgress(progress: number): number {
  'worklet';
  return clamp(progress, SLIDER_MIN, SLIDER_MAX);
}

/**
 * Converts slider progress to an amount.
 *
 * Handles:
 * - Decimal truncation for display
 * - Order of magnitude handling for small amounts
 * - Significant digits with buffer
 * - Price conversions to native value
 * - True balance vs display balance
 */
export function amountFromSliderProgress(
  progress: number,
  balance: string,
  nativePrice: number,
  decimals: number
): { amount: string; nativeValue: string; trueBalance?: string } {
  'worklet';
  const clampedProgress = clampSliderProgress(progress);

  if (progress === 0 || equalWorklet(balance, '0')) {
    return { amount: '0', nativeValue: '0' };
  }

  if (clampedProgress >= SLIDER_MAX) {
    const sanitizedBalance = sanitizeAmount(balance);

    let displayDecimals;
    if (lessThanWorklet(sanitizedBalance, '1')) {
      const orderOfMagnitude = orderOfMagnitudeWorklet(sanitizedBalance);
      const sigDigitsWithBuffer = -orderOfMagnitude - 1 + 3;
      displayDecimals = Math.min(sigDigitsWithBuffer, 8);
    } else {
      displayDecimals = Math.min(decimals, 3);
    }

    const displayAmount = truncateToDecimals(sanitizedBalance, displayDecimals);
    const nativeValue = sanitizeAmount(toFixedWorklet(mulWorklet(displayAmount, nativePrice), 2));

    return { amount: displayAmount, nativeValue, trueBalance: sanitizedBalance };
  }

  const percentage = clampedProgress / SLIDER_MAX;
  const rawAmount = mulWorklet(balance, percentage);
  const formattedAmount = handleSignificantDecimalsWorklet(rawAmount, decimals);
  const sanitizedAmount = sanitizeAmount(formattedAmount);
  const nativeValue = mulWorklet(sanitizedAmount, nativePrice);

  return {
    amount: sanitizedAmount,
    nativeValue: sanitizeAmount(toFixedWorklet(nativeValue, 2)),
  };
}

export function valueFromSliderProgress(progress: number, balance: string, decimals = 2): { amount: string; trueBalance?: string } {
  'worklet';
  const clampedProgress = clampSliderProgress(progress);

  if (progress === 0 || equalWorklet(balance, '0')) {
    return { amount: '0' };
  }

  if (clampedProgress >= SLIDER_MAX) {
    const sanitizedBalance = sanitizeAmount(balance);
    const displayAmount = toFixedWorklet(sanitizedBalance, decimals);
    return { amount: displayAmount, trueBalance: sanitizedBalance };
  }

  const percentage = clampedProgress / SLIDER_MAX;
  const amount = mulWorklet(balance, percentage);
  return { amount: toFixedWorklet(amount, decimals) };
}

export function sliderProgressFromAmount(amount: string, balance: string): number {
  'worklet';
  const sanitized = sanitizeAmount(amount);
  const balanceNum = Number(balance);

  if (balanceNum <= 0) return SLIDER_MIN;

  const ratio = divWorklet(sanitized, balance);
  return clampSliderProgress(Number(ratio) * SLIDER_MAX);
}
