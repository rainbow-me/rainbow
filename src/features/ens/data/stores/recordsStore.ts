import { formatsByCoinType } from '@ensdomains/address-encoder';
import contentHash from '@ensdomains/content-hash';

import { readEnsRecords } from '@/features/ens/data/ens';
import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { ETHEREUM_COIN_TYPE } from '../../core/records';
import type { Records } from '../../types/registration';
import { PROFILE_RECORD_KEYS } from '../recordKeys';

// ============ Types ========================================================== //

export type ProfileRecords = {
  coinAddresses: Partial<Record<string, string>>;
  contenthash?: string;
  records: Records;
};

// ============ Constants ====================================================== //

const STALE_TIME = time.seconds(10);

const CONTENT_PROTOCOLS: Record<string, string | undefined> = {
  'arweave-ns': 'arweave',
  'ipfs-ns': 'ipfs',
  'ipns-ns': 'ipns',
  'onion': 'onion',
  'onion3': 'onion3',
  'skynet-ns': 'sia',
  'swarm-ns': 'bzz',
};

// ============ Profile Records ================================================ //

export const useEnsRecordsStore = createQueryCollectionStore(
  {
    key: (name: string) => name,
    fetcher: fetchProfileRecords,
    disableAutoRefetching: true,
    staleTime: STALE_TIME,
    cacheTime: Infinity,
  },
  { storageKey: 'ensProfileRecords', version: 2 }
);

/**
 * Loads profile records and formats coin addresses and contenthash for display.
 *
 * Unset fields and coin addresses without a display format are omitted.
 * Lookup and contenthash errors reject before the new result is saved.
 */
async function fetchProfileRecords(name: string, signal?: AbortSignal): Promise<ProfileRecords> {
  const keys = PROFILE_RECORD_KEYS;
  const result = await readEnsRecords(name, keys, signal);

  const records: Record<string, string> = Object.create(null);
  const coinAddresses: Record<string, string> = Object.create(null);
  let contenthash: string | undefined;
  if (result) {
    for (const key of keys.texts) {
      const value = result.texts[key];
      if (value !== null) records[key] = value;
    }

    for (const coin of keys.coins) {
      const value = result.coins[coin];
      if (value === null) continue;
      if (coin === ETHEREUM_COIN_TYPE) {
        coinAddresses.ETH = value;
        continue;
      }
      const format = formatsByCoinType[coin];
      if (!format) continue;
      try {
        coinAddresses[format.name] = format.encoder(Buffer.from(value.slice(2), 'hex'));
      } catch {
        continue;
      }
    }

    if (result.contentHash !== null) {
      const codec = contentHash.getCodec(result.contentHash);
      const protocol = CONTENT_PROTOCOLS[codec];
      if (!protocol) throw new Error(`Unsupported ENS contenthash codec: ${codec}`);
      contenthash = `${protocol}://${contentHash.decode(result.contentHash)}`;
    }
  }

  return { coinAddresses, contenthash, records };
}
