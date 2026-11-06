import { getAddress, labelhash, type Address } from 'viem';

import { time } from '@/framework/core/utils/time';
import { ensClient } from '@/graphql';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { normalizeEnsName } from '../../core/name';
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
    const parts = normalizeEnsName(input.name).split('.');
    const labelHash = labelhash(parts[0]);

    if (input.registry) {
      const result = await ensClient.getV2Registration({
        registry: input.registry.toLowerCase(),
        labelhash: labelHash,
      });
      const slot = result.ensv2NameSlots[0];
      if (!slot?.migratedFromV1) {
        return slot?.currentResource?.createdAt ?? null;
      }
    }

    if (parts.length !== 2 || parts[1] !== 'eth') return null;

    const result = await ensClient.getRegistration({ id: labelHash });
    return result.registration?.registrationDate ?? null;
  },
  disableAutoRefetching: true,
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});
