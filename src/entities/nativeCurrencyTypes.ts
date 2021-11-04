import { mapValues } from 'lodash';
import nativeCurrencyReference from '../references/native-currencies.json';

type NativeCurrencyKey = keyof typeof nativeCurrencyReference;
type NativeCurrencyKeysMap = { [Key in NativeCurrencyKey]: Key };

// We can't dynamically generate an enum from the JSON data, but we can
// generate this type-checked object, which is nicer than using strings directly.

/**
 * An enum of native currencies such as "USD" or "ETH".
 */
export const NativeCurrencyKeys = mapValues(
  nativeCurrencyReference,
  (_value, key) => key
) as NativeCurrencyKeysMap;
