/**
 * Formats the payout per unit staked at a price (1 / price) with one decimal,
 * or an empty string when the price is unavailable or not positive.
 */
export function formatPayoutMultiple(price?: string | number): string {
  'worklet';
  const value = Number(price);
  return value > 0 ? `${(1 / value).toFixed(1)}x` : '';
}
