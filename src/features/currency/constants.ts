import { supportedCurrencies as supportedNativeCurrencies } from './supportedCurrencies';
import { NativeCurrencyKeys, type NativeCurrencyKey } from './types';

export const USD_CURRENCY = NativeCurrencyKeys.USD satisfies NativeCurrencyKey;
export const USD_DECIMALS = supportedNativeCurrencies[USD_CURRENCY].decimals;
