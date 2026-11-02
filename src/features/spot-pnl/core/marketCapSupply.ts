import { divWorklet, greaterThanWorklet, lessThanWorklet } from '@/framework/core/safeMath';

/**
 * The supply that turns per-token figures into market caps, set for a token priced under $1 whose market cap is known.
 * `price` and `marketCap` are in the native currency; `null` keeps the figures as prices.
 */
export function resolveCirculatingSupply({
  marketCap,
  price,
  usdToNativeRate,
}: {
  marketCap: string;
  price: string;
  usdToNativeRate: number | undefined;
}): string | null {
  if (!usdToNativeRate || !greaterThanWorklet(price || '0', 0) || !greaterThanWorklet(marketCap, 0)) return null;
  return lessThanWorklet(divWorklet(price, usdToNativeRate), 1) ? divWorklet(marketCap, price) : null;
}
