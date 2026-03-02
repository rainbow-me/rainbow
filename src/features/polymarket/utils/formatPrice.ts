import { ceilWorklet, divWorklet, mulWorklet, orderOfMagnitudeWorklet, toFixedWorklet } from '@/framework/core/safeMath';

export function formatPrice(price: string | number, minTickSize: string | number): string {
  'worklet';
  const decimals = Math.max(0, -orderOfMagnitudeWorklet(minTickSize));
  const divided = divWorklet(price, minTickSize);
  const ceiled = ceilWorklet(divided);
  const roundedPrice = mulWorklet(ceiled, minTickSize);
  return toFixedWorklet(roundedPrice, decimals);
}
