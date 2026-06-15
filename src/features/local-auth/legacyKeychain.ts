import { type GetOptions, type SetOptions, type UserCredentials } from 'react-native-keychain';

import * as kc from './keychain';

/**
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { set } from '@/features/local-auth/keychain'
 *    await set(key, value, options)
 */
export async function saveString(key: string, value: string, accessControlOptions: kc.KeychainOptions<SetOptions>): Promise<void> {
  return kc.set(key, value, accessControlOptions);
}

/**
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { get } from '@/features/local-auth/keychain'
 *    await get(key, options)
 */
export async function loadString(key: string, options?: kc.KeychainOptions<GetOptions>): Promise<null | string | -1 | -2 | 0 | -3> {
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
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { setObject } from '@/features/local-auth/keychain'
 *    await setObject(key, {}, options)
 */
export async function saveObject(
  key: string,
  value: Record<string, unknown>,
  accessControlOptions: kc.KeychainOptions<SetOptions>
): Promise<void> {
  return kc.setObject(key, value, accessControlOptions);
}

/**
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { getObject } from '@/features/local-auth/keychain'
 *    await getObject(key, options)
 */
export async function loadObject(
  key: string,
  options?: kc.KeychainOptions<GetOptions>
): Promise<null | Record<string, any> | -1 | -2 | 0 | -3> {
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
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { remove } from '@/features/local-auth/keychain'
 *    await remove(key)
 */
export async function remove(key: string): Promise<void> {
  await kc.remove(key);
}

/**
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { getAllKeys } from '@/features/local-auth/keychain'
 *    await getAllKeys()
 */
export async function loadAllKeys(): Promise<null | UserCredentials[]> {
  return (await kc.getAllKeys()) || null;
}

/**
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { has } from '@/features/local-auth/keychain'
 *    await has(key)
 */
export async function hasKey(key: string): Promise<boolean> {
  return kc.has(key);
}

/**
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { clear } from '@/features/local-auth/keychain'
 *    await clear()
 */
export async function wipeKeychain(): Promise<void> {
  await kc.clear();
}

/**
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { publicAccessControlOptions } from '@/features/local-auth/keychain'
 */
export const publicAccessControlOptions = kc.publicAccessControlOptions;

/**
 * @deprecated use `@/features/local-auth/keychain` instead
 *
 * @example
 *    import { getPrivateAccessControlOptions } from '@/features/local-auth/keychain'
 *    await getPrivateAccessControlOptions()
 */
export { getPrivateAccessControlOptions } from './keychain';
