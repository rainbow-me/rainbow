import { getAddress, labelhash, zeroAddress, type Address } from 'viem';

import { time } from '@/framework/core/utils/time';
import { ensClient } from '@/graphql';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { normalizeEnsName } from '../../core/name';
import { ENS_DOMAIN, getNameOwner } from '../../utils/helpers';
import { readEnsOwnership } from '../ownership';
import { readEnsPermissions } from '../permissions';

export const useEnsOwnershipStore = createQueryCollectionStore({
  key: (name: string) => name,
  fetcher: readEnsOwnership,
  disableAutoRefetching: true,
  staleTime: time.seconds(10),
  cacheTime: time.minutes(5),
});

export const useEnsPermissionsStore = createQueryCollectionStore({
  key: (input: { name: string; account: string }) => `${input.name}:${input.account.toLowerCase()}`,
  fetcher: (input, signal) => readEnsPermissions(input.name, getAddress(input.account), signal),
  disableAutoRefetching: true,
  staleTime: time.seconds(10),
  cacheTime: time.minutes(5),
});

/**
 * Loads indexed registration dates, retaining the original date for migrated .eth names.
 */
export const useEnsRegistrationDateStore = createQueryCollectionStore({
  key: (input: { name: string; registry?: Address }) => `${input.name}:${input.registry ?? ''}`,
  fetcher: async input => {
    const name = normalizeEnsName(input.name);

    if (input.registry) {
      const result = await ensClient.getV2Registration({
        registry: input.registry.toLowerCase(),
        labelhash: labelhash(name.split('.')[0]),
      });
      const slot = result.ensv2NameSlots[0];
      if (!slot?.migratedFromV1) {
        return slot?.currentResource?.createdAt ?? null;
      }
    }

    const labels = name.split('.');
    if (labels.length !== 2 || labels[1] !== 'eth') return null;

    const result = await ensClient.getRegistration({ id: labelhash(labels[0]) });
    return result.registration?.registrationDate ?? null;
  },
  disableAutoRefetching: true,
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});

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
