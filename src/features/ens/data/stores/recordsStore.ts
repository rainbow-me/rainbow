import { formatsByCoinType, formatsByName } from '@ensdomains/address-encoder';
import contentHash from '@ensdomains/content-hash';

import { ETHEREUM_COIN_TYPE, readEnsRecords, type EnsRecordKeys } from '@/features/ens/data/ens';
import { time } from '@/framework/core/utils/time';
import { ensClient } from '@/graphql';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { ENS_RECORDS } from '../../core/records';
import type { Records } from '../../types/registration';

// ============ Types ========================================================== //

type ProfileRecords = {
  coinAddresses: Partial<Record<string, string>>;
  contenthash?: string;
  records: Records;
};

// ============ Constants ====================================================== //

const STALE_TIME = time.seconds(10);
const PROFILE_RECORDS = getProfileRecordKeys();
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
    key: ({ name, supportedOnly = true }: { name: string; supportedOnly?: boolean }) => `${name}:${supportedOnly}`,
    fetcher: fetchProfileRecords,
    disableAutoRefetching: true,
    staleTime: STALE_TIME,
    cacheTime: Infinity,
  },
  { storageKey: 'ensProfileRecords' }
);

/**
 * Loads profile records and formats coin addresses and contenthash for display.
 *
 * Expanded reads include indexed keys for editing. Unset or unsupported fields
 * and coin addresses without a usable display format are omitted. Lookup and
 * contenthash errors reject before the new result is saved.
 */
async function fetchProfileRecords(
  { name, supportedOnly = true }: { name: string; supportedOnly?: boolean },
  signal?: AbortSignal
): Promise<ProfileRecords> {
  let keys: EnsRecordKeys = PROFILE_RECORDS;
  if (!supportedOnly) {
    const [textIndex, coinIndex] = await Promise.all([ensClient.getTextRecordKeysByName({ name }), ensClient.getCoinTypesByName({ name })]);
    keys = {
      texts: [...new Set([...PROFILE_RECORDS.texts, ...(textIndex.domains[0]?.resolver?.texts ?? [])])],
      coins: [...new Set([...PROFILE_RECORDS.coins, ...(coinIndex.domains[0]?.resolver?.coinTypes ?? [])])],
    };
  }
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

function getProfileRecordKeys(): EnsRecordKeys {
  const texts: string[] = [];
  const coins: number[] = [];

  for (const key of Object.values(ENS_RECORDS)) {
    if (key === ENS_RECORDS.contenthash) continue;
    const format = formatsByName[key];
    if (format) coins.push(format.coinType);
    else texts.push(key);
  }

  return { texts, coins };
}
