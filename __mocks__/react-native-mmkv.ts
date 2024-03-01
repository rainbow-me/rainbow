import type { NativeMMKV } from 'react-native-mmkv';

type MMKVValue = boolean | string | number | Uint8Array;

const GLOBAL_SHARED_STORAGE: {
  [key: string]: Map<string, MMKVValue>;
} = {};

/**
 * Based on the provided MMKV mock, but with global memory support to match actual MMKV usage.
 *
 * @see https://github.com/mrousavy/react-native-mmkv/blob/77982c1a61a5e6d2683e6569ca92e09390b28c48/src/createMMKV.mock.ts
 */
export class MMKV implements NativeMMKV {
  id = 'default';
  storage: Map<string, MMKVValue>;

  constructor({ id }: { id: string }) {
    this.id = id;

    // `this.storage` is just a shorthand to the shared global storage, scoped to this instance
    // eslint-disable-next-line no-multi-assign
    this.storage = GLOBAL_SHARED_STORAGE[this.id] = GLOBAL_SHARED_STORAGE[this.id] || new Map<string, string | boolean | number>();
  }

  clearAll() {
    this.storage.clear();
  }

  delete(key: string) {
    this.storage.delete(key);
  }

  set(key: string, value: MMKVValue) {
    this.storage.set(key, value);
  }

  getString(key: string) {
    const result = this.storage.get(key);
    return typeof result === 'string' ? result : undefined;
  }

  getNumber(key: string) {
    const result = this.storage.get(key);
    return typeof result === 'number' ? result : undefined;
  }

  getBoolean(key: string) {
    const result = this.storage.get(key);
    return typeof result === 'boolean' ? result : undefined;
  }

  getBuffer(key: string) {
    const result = this.storage.get(key);
    return result instanceof Uint8Array ? result : undefined;
  }

  getAllKeys() {
    return Array.from(this.storage.keys());
  }

  contains(key: string) {
    return this.storage.has(key);
  }

  recrypt() {
    console.warn('Encryption is not supported in mocked MMKV instances!');
  }
}
