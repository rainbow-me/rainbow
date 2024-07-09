import { MMKV } from 'react-native-mmkv';

import { Account, Cards, Campaigns, Device, Review } from '@/storage/schema';
import { EthereumAddress, RainbowTransaction } from '@/entities';
import { Network } from '@/networks/types';

/**
 * Generic storage class. DO NOT use this directly. Instead, use the exported
 * storage instances below.
 */
export class Storage<Scopes extends unknown[], Schema> {
  protected sep = ':';
  protected store: MMKV;

  constructor({ id }: { id: string }) {
    this.store = new MMKV({ id });
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
   * Remove many values from the same storage scope by keys
   *
   *   `removeMany([], [key])`
   *   `removeMany([scope], [key])`
   */
  removeMany<Key extends keyof Schema>(scopes: [...Scopes], keys: Key[]) {
    keys.forEach(key => this.remove([...scopes, key]));
  }
}

/**
 * Device data that's specific to the device and does not vary based on network or active wallet
 *
 *   `global.set(['doNotTrack'], true)`
 */
export const device = new Storage<[], Device>({ id: 'global' });

export const account = new Storage<[EthereumAddress, Network], Account>({
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
