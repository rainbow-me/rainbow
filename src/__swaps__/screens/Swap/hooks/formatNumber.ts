import store from '@/redux/store';
import { supportedNativeCurrencies } from '@/references';

const decimalSeparator = '.';
export const formatNumber = (value: string, options?: { decimals?: number }) => {
  if (!+value) return `0${decimalSeparator}00`;
  if (+value < 0.0001) return `<0${decimalSeparator}0001`;

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

const getUserPreferredCurrency = () => {
  const currency = store.getState().settings.nativeCurrency;
  return supportedNativeCurrencies[currency];
};

export const formatCurrency = (value: string, currency = getUserPreferredCurrency()) => {
  const formatted = formatNumber(value);
  if (currency.alignment === 'left') return `${currency.symbol}${formatted}`;
  return `${formatted} ${currency.symbol}`;
};
