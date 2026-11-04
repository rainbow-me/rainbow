import { USD_DECIMALS } from '@/features/currency/constants';
import { divWorklet, maxWorklet, minWorklet, toFixedWorklet } from '@/framework/core/safeMath';

/**
 * Uses half the balance or $10, whichever is greater, capped by the available balance and rounded to cents.
 */
export function getInitialSliderAmount(availableBalance: string): string {
  'worklet';
  const amount = minWorklet(availableBalance, maxWorklet('10', divWorklet(availableBalance, 2)));

  return toFixedWorklet(amount, USD_DECIMALS);
}
