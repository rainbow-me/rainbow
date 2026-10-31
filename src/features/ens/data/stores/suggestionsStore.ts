import { getAddress, isAddress, zeroAddress } from 'viem';

import { time } from '@/framework/core/utils/time';
import { ensClient } from '@/graphql';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';
import { addressHashedColorIndex } from '@/utils/profileUtils';

import { useEnsNameStore } from '../useEnsNameStore';

export const useEnsSuggestionsStore = createQueryCollectionStore({
  key: (input: string) => input.toLowerCase(),
  fetcher: async input => {
    if (isAddress(input)) {
      const address = getAddress(input);
      const name = await useEnsNameStore.getState().load(address);
      return name
        ? [{ address, nickname: name, uniqueId: address, color: addressHashedColorIndex(address), ens: true, network: 'mainnet' }]
        : [];
    }
    const { domains } = await ensClient.getSuggestions({ name: input.toLowerCase(), first: 8 });
    return domains
      .flatMap(domain => {
        const name = domain.name;
        if (!name || name.includes('[') || domain.owner.id === zeroAddress) return [];
        const address = domain.resolver?.addr?.id || name;
        return [{ address, nickname: name, uniqueId: address, color: addressHashedColorIndex(address), ens: true, network: 'mainnet' }];
      })
      .sort((a, b) => a.nickname.length - b.nickname.length);
  },
  disableAutoRefetching: true,
  staleTime: time.minutes(1),
  cacheTime: time.minutes(5),
});
