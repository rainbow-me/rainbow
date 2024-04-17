import { Storage } from '@/storage';
import { deprecatedGetLocal, deprecatedRemoveLocal } from '@/handlers/localstorage/common';

import { Legacy } from '@/storage/schema';
import { logger, RainbowError } from '@/logger';

/**
 * Storage for legacy data that was previously stored in AsyncStorage. Only
 * difference is that `get()` is `async`, because it first checks for data in
 * AsyncStorage before returning it.
 */
class LegacyStorage<Scopes extends unknown[], Schema> extends Storage<Scopes, Schema> {
  /**
   * IMPORTANT: This method is async, different from our other MMKV storage
   * classes. It migrates data from AsyncStorage to MMKV, and then removes it,
   * and returns the value.
   *
   * Get a value from storage based on scopes and/or keys
   *
   *   `await get([key])`
   *   `await get([scope, key])`
   */
  // @ts-ignore Not the same signature as the parent class
  async get<Key extends keyof Schema>(scopes: [...Scopes, Key]): Promise<Schema[Key] | undefined> {
    const key = scopes.join(this.sep);
    const res = this.store.getString(key);

    if (!res) {
      try {
        const legacyValue = await deprecatedGetLocal(key); // get old value from AsyncStorage
        this.set(scopes, legacyValue); // set first
        deprecatedRemoveLocal(key); // then remove if successful
        return this.get(scopes); // continue as normal
      } catch (e) {
        logger.error(new RainbowError(`Storage: error migrating legacy data`), {
          key,
        });
        return undefined;
      }
    }

    // parsed from storage structure `{ data: <value> }`
    return JSON.parse(res).data;
  }
}

/**
 * IMPORTANT: This uses the same MMKV storage key as our device data so that in
 * the future we can simply move to using our other global `device` storage
 * instance instead of this one.
 */
export const legacy = new LegacyStorage<[], Legacy>({ id: 'global' });
export const zustandStorage = new LegacyStorage<[], Legacy>({ id: 'zustand' });
export const queryStorage = new LegacyStorage<[], Legacy>({ id: 'rainbow.react-query' });
