import { mapValues } from 'lodash';
import { supportedNativeCurrencies } from '@/references';

export type NativeCurrencyKey = keyof typeof supportedNativeCurrencies;
type NativeCurrencyKeysMap = { [Key in NativeCurrencyKey]: Key };

// We can't dynamically generate an enum from the JSON data, but we can
// generate this type-checked object, which is nicer than using strings directly.

/**
 * An enum of native currencies such as "USD" or "ETH".
 */
export const NativeCurrencyKeys = mapValues(supportedNativeCurrencies, (_value, key) => key) as NativeCurrencyKeysMap;
