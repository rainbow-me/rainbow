export function parseDecimalParts(value: string): {
  whole: string;
  fractionalSuffix: string;
} {
  const decimalIndex = value.lastIndexOf('.');

  if (decimalIndex === -1) {
    return { whole: value, fractionalSuffix: '' };
  }

  return {
    whole: value.slice(0, decimalIndex),
    fractionalSuffix: value.slice(decimalIndex),
  };
}
