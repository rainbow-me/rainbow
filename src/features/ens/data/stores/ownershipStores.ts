import { getAddress, zeroAddress } from 'viem';

import { time } from '@/framework/core/utils/time';
import { ensClient } from '@/graphql';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';
import labelhash from '@/utils/labelhash';

import { ENS_DOMAIN, getNameOwner } from '../../utils/helpers';

/**
 * Ownership and registration metadata for the legacy registry and its index.
 */
export const useEnsOwnerStore = createQueryCollectionStore(
  {
    key: (name: string) => name,
    fetcher: async name => {
      const address = getAddress(await getNameOwner(name));
      return address === zeroAddress ? null : address;
    },
    disableAutoRefetching: true,
    staleTime: time.seconds(10),
    cacheTime: Infinity,
  },
  { storageKey: 'ensOwners' }
);

export const useEnsRegistrationMetadataStore = createQueryCollectionStore(
  {
    key: (name: string) => name,
    fetcher: async name => (await ensClient.getRegistration({ id: labelhash(name.replace(ENS_DOMAIN, '')) })).registration ?? null,
    disableAutoRefetching: true,
    staleTime: time.seconds(10),
    cacheTime: Infinity,
  },
  { storageKey: 'ensRegistrationMetadata' }
);
