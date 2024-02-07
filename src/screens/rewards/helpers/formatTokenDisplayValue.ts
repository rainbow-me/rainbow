export function formatTokenDisplayValue(tokenValue: number, tokenSymbol: string): string {
  const formattedValue = tokenValue.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
  return `${formattedValue} ${tokenSymbol}`;
}
