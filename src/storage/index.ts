import { MMKV } from 'react-native-mmkv';

import { Account, Cards, Campaigns, Device, Review, WatchedWalletCohort } from '@/storage/schema';
import { EthereumAddress, RainbowTransaction } from '@/entities';
import { SecureStorage } from '@coinbase/mobile-wallet-protocol-host';
import { ChainId } from '@/state/backendNetworks/types';

/**
 * Generic storage class. DO NOT use this directly. Instead, use the exported
 * storage instances below.
 */
export class Storage<Scopes extends unknown[], Schema> {
  protected sep = ':';
  protected store: MMKV;

  constructor({ id, encryptionKey }: { id: string; encryptionKey?: string }) {
    this.store = new MMKV({ id, encryptionKey });
  }

  /**
   * Store a value in storage based on scopes and/or keys
   *
   *   `set([key], value)`
   *   `set([scope, key], value)`
   */
  set<Key extends keyof Schema>(scopes: [...Scopes, Key], data: Schema[Key]): void {
    // stored as `{ data: <value> }` structure to ease stringification
    this.store.set(scopes.join(this.sep), JSON.stringify({ data }));
  }

  /**
   * Get a value from storage based on scopes and/or keys
   *
   *   `get([key])`
   *   `get([scope, key])`
   */
  get<Key extends keyof Schema>(scopes: [...Scopes, Key]): Schema[Key] | undefined {
    const res = this.store.getString(scopes.join(this.sep));
    if (!res) return undefined;
    // parsed from storage structure `{ data: <value> }`
    return JSON.parse(res).data;
  }

  /**
   * Remove a value from storage based on scopes and/or keys
   *
   *   `remove([key])`
   *   `remove([scope, key])`
   */
  remove<Key extends keyof Schema>(scopes: [...Scopes, Key]) {
    this.store.delete(scopes.join(this.sep));
  }

  /**
   * Clear all values from storage
   */
  clear() {
    this.store.clearAll();
  }

  /**
   * Remove many values from the same storage scope by keys
   *
   *   `removeMany([], [key])`
   *   `removeMany([scope], [key])`
   */
  removeMany<Key extends keyof Schema>(scopes: [...Scopes], keys: Key[]) {
    keys.forEach(key => this.remove([...scopes, key]));
  }

  /**
   * Encrypt the storage with a new key
   * @param newEncryptionKey - The new encryption key
   */
  encrypt(newEncryptionKey: string): void {
    this.store.recrypt(newEncryptionKey);
  }

  /**
   * Remove encryption from the storage
   */
  removeEncryption(): void {
    this.store.recrypt(undefined);
  }
}

/**
 * Device data that's specific to the device and does not vary based on network or active wallet
 *
 *   `global.set(['doNotTrack'], true)`
 */
export const device = new Storage<[], Device>({ id: 'global' });

export const account = new Storage<[EthereumAddress, ChainId], Account>({
  id: 'account',
});

export const pendingTransactions = new Storage<[], { pendingTransactions: Record<string, RainbowTransaction[]> }>({
  id: 'pendingTransactions',
});

export const review = new Storage<[], Review>({ id: 'review' });

/**
 * @deprecated - use `remotePromoSheetStore` instead
 */
export const campaigns = new Storage<[], Campaigns>({ id: 'campaigns' });

export const cards = new Storage<[], Cards>({ id: 'cards' });

export const identifier = new Storage<[], { identifier: string }>({
  id: 'identifier',
});

/**
 * Mobile Wallet Protocol storage
 *
 * @todo - fix any type here
 */
const mwpStorage = new Storage<[], { [key: string]: string }>({ id: 'mwp', encryptionKey: process.env.MWP_ENCRYPTION_KEY });

export const mwp: SecureStorage = {
  get: async function <T>(key: string): Promise<T | undefined> {
    const dataJson = mwpStorage.get([key]);
    if (dataJson === undefined) {
      return undefined;
    }
    return Promise.resolve(JSON.parse(dataJson) as T);
  },
  set: async function <T>(key: string, value: T): Promise<void> {
    const encoded = JSON.stringify(value);
    mwpStorage.set([key], encoded);
  },
  remove: async function (key: string): Promise<void> {
    mwpStorage.remove([key]);
  },
};

export const watchedWalletCohort = new Storage<[], WatchedWalletCohort>({ id: 'watchedWalletCohort' });
