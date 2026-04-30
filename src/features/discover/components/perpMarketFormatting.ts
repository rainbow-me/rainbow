export function formatCompactPerpPercentChange(percentChange: number): string {
  const numericValue = Math.abs(percentChange);

  return Number.isFinite(numericValue) ? `${numericValue.toFixed(2)}%` : '0.00%';
}

export function convertStoredPerpPriceChangeToPercent(priceChange: string): number {
  return Number(priceChange) * 10_000;
}
