import { formatsByName } from '@ensdomains/address-encoder';

import { ENS_RECORDS } from '../core/records';
import type { EnsRecordKeys } from './ens';

export const PROFILE_RECORD_KEYS = getProfileRecordKeys();

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
