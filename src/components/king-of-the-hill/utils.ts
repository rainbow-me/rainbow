export const formatPriceChange = (relativeChange?: number | null): string => {
  if (!relativeChange && relativeChange !== 0) return 'N/A';

  const percentage = (relativeChange * 100).toFixed(2);
  const isPositive = relativeChange > 0;

  // Use up arrow for positive, dash for negative with consistent spacing
  return isPositive ? `↑ ${percentage}%` : `- ${Math.abs(parseFloat(percentage))}%`;
};

export const getPriceChangeColor = (priceChange: string): string => {
  if (priceChange === 'N/A') return 'labelQuaternary';
  return priceChange.startsWith('↑') ? 'green' : 'labelQuaternary';
};
