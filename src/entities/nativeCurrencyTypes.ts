import nativeCurrencyReference from '../references/native-currencies.json';

type NativeCurrencyKey = keyof typeof nativeCurrencyReference;
type NativeCurrencyKeysMap = { [key in NativeCurrencyKey]: NativeCurrencyKey };

// We can't dynamically generate an enum from the JSON data, but we can
// generate this type-checked object, which is nicer than using strings directly.
const nativeKeys: Partial<NativeCurrencyKeysMap> = {};
for (let key of Object.keys(nativeCurrencyReference) as NativeCurrencyKey[]) {
  nativeKeys[key] = key;
}

/**
 * An enum of native currencies such as "USD" or "ETH".
 */
export const NativeCurrencyKeys: NativeCurrencyKeysMap = nativeKeys as NativeCurrencyKeysMap;
