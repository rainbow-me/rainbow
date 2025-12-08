export function formatPrice(price: number, minTickSize: number): number {
  const decimals = Math.round(-Math.log10(minTickSize));
  const roundedPrice = Math.ceil(price / minTickSize) * minTickSize;
  return Number(roundedPrice.toFixed(decimals));
}
