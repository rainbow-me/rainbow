export function formatTokenDisplayValue(
  tokenValue: number,
  tokenSymbol: string
): string {
  const formattedValue = tokenValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formattedValue} ${tokenSymbol}`;
}
