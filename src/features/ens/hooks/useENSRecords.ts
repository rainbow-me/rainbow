import { formatsByCoinType, formatsByName } from '@ensdomains/address-encoder';
import contentHash from '@ensdomains/content-hash';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { ETHEREUM_COIN_TYPE, readEnsRecords, type EnsRecordKeys } from '@/features/ens/data/ens';
import { ensClient } from '@/graphql';
import { queryClient, type QueryConfigDeprecated } from '@/react-query';

import type { Records } from '../types/registration';
import { ENS_RECORDS } from '../utils/helpers';
import { getENSData, saveENSData } from '../utils/localStorage';

// ============ Types ========================================================== //

type ProfileRecords = {
  coinAddresses: Partial<Record<ENS_RECORDS, string>>;
  contenthash?: string;
  records: Records;
};

// ============ Constants ====================================================== //

const STALE_TIME = 10000;
const PROFILE_RECORDS = getProfileRecordKeys();
const CONTENT_PROTOCOLS: Record<string, string | undefined> = {
  'ipfs-ns': 'ipfs',
  'ipns-ns': 'ipns',
  'skynet-ns': 'sia',
  'swarm-ns': 'bzz',
};

// ============ Profile Records ================================================ //

/** Identifies the supported or expanded records for one profile. */
export const ensRecordsQueryKey = ({
  name,
  supportedOnly = true,
}: {
  name: string;
  supportedOnly?: boolean;
}): readonly ['ens-records', string, boolean] => ['ens-records', name, supportedOnly];

/**
 * Loads profile records and formats coin addresses and contenthash for display.
 *
 * Expanded reads include indexed keys for editing. Unset or unsupported fields
 * and coin addresses without a usable display format are omitted. Lookup and
 * contenthash errors reject before the new result is saved.
 */
export async function fetchENSRecords(
  name: string,
  { cacheFirst, supportedOnly = true }: { cacheFirst?: boolean; supportedOnly?: boolean } = {}
): Promise<ProfileRecords> {
  const cachedRecords: ProfileRecords | null = await getENSData('records', name);

  if (cachedRecords) {
    queryClient.setQueryData(ensRecordsQueryKey({ name, supportedOnly }), cachedRecords);
    if (cacheFirst) return cachedRecords;
  }

  let keys: EnsRecordKeys = PROFILE_RECORDS;
  if (!supportedOnly) {
    const [textIndex, coinIndex] = await Promise.all([ensClient.getTextRecordKeysByName({ name }), ensClient.getCoinTypesByName({ name })]);
    keys = {
      texts: [...new Set([...PROFILE_RECORDS.texts, ...(textIndex.domains[0]?.resolver?.texts ?? [])])],
      coins: [...new Set([...PROFILE_RECORDS.coins, ...(coinIndex.domains[0]?.resolver?.coinTypes ?? [])])],
    };
  }
  const result = await readEnsRecords(name, keys);

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

  const data = { coinAddresses, contenthash, records };
  saveENSData('records', name, data);
  return data;
}

/** Warms the existing profile-record cache. */
export function prefetchENSRecords(
  name: string,
  { cacheFirst, supportedOnly = true }: { cacheFirst?: boolean; supportedOnly?: boolean } = {}
): Promise<void> {
  return queryClient.prefetchQuery(
    ensRecordsQueryKey({ name, supportedOnly }),
    async () => fetchENSRecords(name, { cacheFirst, supportedOnly }),
    {
      staleTime: STALE_TIME,
    }
  );
}

/** Subscribes to decoded records for the requested profile. */
export default function useENSRecords(
  name: string,
  {
    supportedOnly = true,
    ...config
  }: QueryConfigDeprecated<typeof fetchENSRecords> & {
    supportedOnly?: boolean;
  } = {}
): UseQueryResult<ProfileRecords> {
  return useQuery<ProfileRecords>(ensRecordsQueryKey({ name, supportedOnly }), async () => fetchENSRecords(name, { supportedOnly }), {
    ...config,
    // Data will be stale for 10s to avoid dupe queries
    staleTime: STALE_TIME,
  });
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
