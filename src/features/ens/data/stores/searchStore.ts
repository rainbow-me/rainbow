import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { ENS_DOMAIN, getAvailable, getENSRegistrarControllerContract, getNameExpires, getRentPrice } from '../../utils/helpers';
import { validateENS } from '../../utils/records';
import { useEnsRegistrationMetadataStore } from './ownershipStores';

export const useEnsSearchStore = createQueryCollectionStore({
  key: ({ name, duration }: { name: string; duration: number }) => `${name}:${duration}`,
  fetcher: async ({ name, duration }) => {
    const validation = validateENS(name + ENS_DOMAIN, { includeSubdomains: false });
    if (!validation.valid) return { valid: false as const, code: validation.code, hint: validation.hint };

    const contract = await getENSRegistrarControllerContract();
    const [available, price] = await Promise.all([getAvailable(name, contract), getRentPrice(name, duration, contract)]);
    const [registration, expirationDate] = available
      ? [null, null]
      : await Promise.all([useEnsRegistrationMetadataStore.getState().load(name + ENS_DOMAIN), getNameExpires(name)]);
    return { valid: true as const, available, rentPrice: String(price), registrationDate: registration?.registrationDate, expirationDate };
  },
  retry: false,
  staleTime: Infinity,
  cacheTime: time.minutes(5),
});
