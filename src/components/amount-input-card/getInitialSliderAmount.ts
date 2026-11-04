import { USD_DECIMALS } from '@/features/currency/constants';
import { divWorklet, greaterThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';

/** Uses the full balance through $10 and half above it, rounded to cents. */
export function getInitialSliderAmount(availableBalance: string): string {
  'worklet';
  const amount = greaterThanWorklet(availableBalance, '10') ? divWorklet(availableBalance, 2) : availableBalance;
  return toFixedWorklet(amount, USD_DECIMALS);
}
