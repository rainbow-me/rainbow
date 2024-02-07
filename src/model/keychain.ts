import { Options, Result, UserCredentials } from 'react-native-keychain';
import * as kc from '@/keychain';

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { set } from '@/keychain'
 *    await set(key, value, options)
 */
export async function saveString(key: string, value: string, accessControlOptions: Options): Promise<void> {
  return kc.set(key, value, accessControlOptions);
}

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { get } from '@/keychain'
 *    await get(key, options)
 */
export async function loadString(key: string, options?: Options): Promise<null | string | -1 | -2 | 0 | -3> {
  const { value, error } = await kc.get(key, options);

  if (value) {
    return value;
  }

  // backwards compat
  if (error === -1 || error === -2) {
    return error;
  }

  return null;
}

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { setObject } from '@/keychain'
 *    await setObject(key, {}, options)
 */
export async function saveObject(key: string, value: Record<string, unknown>, accessControlOptions: Options): Promise<void> {
  return kc.setObject(key, value, accessControlOptions);
}

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { getObject } from '@/keychain'
 *    await getObject(key, options)
 */
export async function loadObject(key: string, options?: Options): Promise<null | Record<string, any> | -1 | -2 | 0 | -3> {
  const { value, error } = await kc.getObject(key, options);

  if (value) {
    return value;
  }

  // backwards compat
  if (error === -1 || error === -2) {
    return error;
  }

  return null;
}

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { remove } from '@/keychain'
 *    await remove(key)
 */
export async function remove(key: string): Promise<void> {
  await kc.remove(key);
}

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { getAllKeys } from '@/keychain'
 *    await getAllKeys()
 */
export async function loadAllKeys(): Promise<null | UserCredentials[]> {
  return (await kc.getAllKeys()) || null;
}

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { has } from '@/keychain'
 *    await has(key)
 */
export async function hasKey(key: string): Promise<boolean | Result> {
  return kc.has(key);
}

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { clear } from '@/keychain'
 *    await clear()
 */
export async function wipeKeychain(): Promise<void> {
  await kc.clear();
}

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { publicAccessControlOptions } from '@/keychain'
 */
export const publicAccessControlOptions = kc.publicAccessControlOptions;

/**
 * @deprecated use `@/keychain` instead
 *
 * @example
 *    import { getPrivateAccessControlOptions } from '@/keychain'
 *    await getPrivateAccessControlOptions()
 */
export { getPrivateAccessControlOptions } from '@/keychain';
