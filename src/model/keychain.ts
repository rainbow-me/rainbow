import { Options, Result, UserCredentials } from 'react-native-keychain';
import * as kc from '@/keychain';

export async function saveString(
  key: string,
  value: string,
  accessControlOptions: Options
): Promise<void> {
  return kc.set(key, value, accessControlOptions);
}

export async function loadString(
  key: string,
  options?: Options
): Promise<null | string | -1 | -2 | 0 | 1> {
  const { value, error } = await kc.get(key, options);
  return value ? value : error || null;
}

export async function saveObject(
  key: string,
  value: Record<string, unknown>,
  accessControlOptions: Options
): Promise<void> {
  return kc.setObject(key, value, accessControlOptions);
}

export async function loadObject(
  key: string,
  options?: Options
): Promise<null | Record<string, any> | -1 | -2 | 0 | 1> {
  const { value, error } = await kc.getObject(key, options);
  return value ? value : error || null;
}

export async function remove(key: string): Promise<void> {
  await kc.remove(key);
}

export async function loadAllKeys(): Promise<null | UserCredentials[]> {
  return kc.getAllCredentials();
}

export async function hasKey(key: string): Promise<boolean | Result> {
  return kc.has(key);
}

export async function wipeKeychain(): Promise<void> {
  await kc.clear();
}

export const publicAccessControlOptions = kc.publicAccessControlOptions;

export { getPrivateAccessControlOptions } from '@/keychain';
