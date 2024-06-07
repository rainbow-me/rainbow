const decimalSeparator = '.';
const lessThanPrefix = '<';

export const formatNumber = (value: string, options?: { decimals?: number }) => {
  if (!+value) return `0${decimalSeparator}0`;
  if (+value < 0.0001) return `${lessThanPrefix}0${decimalSeparator}0001`;

  const [whole, fraction = ''] = value.split(decimalSeparator);
  const decimals = options?.decimals;
  const paddedFraction = `${fraction.padEnd(decimals || 4, '0')}`;

  if (decimals) {
    if (decimals === 0) return whole;
    return `${whole}${decimalSeparator}${paddedFraction.slice(0, decimals)}`;
  }

  if (+whole > 0) return `${whole}${decimalSeparator}${paddedFraction.slice(0, 2)}`;
  return `0${decimalSeparator}${paddedFraction.slice(0, 4)}`;
};
