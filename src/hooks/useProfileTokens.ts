import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';

import { analytics } from '@/analytics';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { PreferenceActionType, setPreference } from '@/model/preferences';
import { queryClient } from '@/react-query';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { getIsReadOnlyWallet, useAccountAddress } from '@/state/wallets/walletsStore';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

import {
  loadIds,
  profileTokensQueryKey,
  useFetchHiddenTokens,
  useFetchShowcaseTokens,
  type ProfileTokenCategory,
} from './useFetchProfileTokens';

function useProfileTokenListMutation<TVariable>({
  category,
  address,
  computeNext,
  onWriteSuccess,
}: {
  category: ProfileTokenCategory;
  address: string;
  computeNext: (current: string[], variable: TVariable) => string[];
  onWriteSuccess?: (variable: TVariable) => void;
}) {
  const queryKey = profileTokensQueryKey(category, address);

  return useMutation({
    mutationFn: async (variable: TVariable) => {
      if (getIsReadOnlyWallet()) {
        return queryClient.getQueryData<string[]>(queryKey) ?? [];
      }
      const current = queryClient.getQueryData<string[]>(queryKey) ?? [];
      const next = computeNext(current, variable);
      const existing = await loadIds(category, address);
      const action = existing?.length ? PreferenceActionType.update : PreferenceActionType.init;
      await setPreference(action, category, address, next);
      onWriteSuccess?.(variable);
      return next;
    },
    onMutate: async (variable: TVariable) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string[]>(queryKey) ?? [];
      queryClient.setQueryData(queryKey, computeNext(previous, variable));
      return { previous };
    },
    onError: (_err: unknown, _vars: TVariable, context: { previous: string[] } | undefined) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
  });
}

export function useShowcaseTokens(address?: string) {
  const accountAddress = useAccountAddress();
  const addressToUse = address || accountAddress;
  const { data: showcaseTokens = [], isLoading: isLoadingShowcaseTokens } = useFetchShowcaseTokens({ address: addressToUse });

  const add = useProfileTokenListMutation<string>({
    category: 'showcase',
    address: addressToUse,
    computeNext: (current, asset) => [...current, asset.toLowerCase()],
  });
  const remove = useProfileTokenListMutation<string>({
    category: 'showcase',
    address: addressToUse,
    computeNext: (current, asset) => current.filter(id => !isLowerCaseMatch(id, asset)),
  });

  const addShowcaseToken = useCallback(
    async (asset: string) => {
      useOpenCollectionsStore.getState(addressToUse).setCollectionOpen('showcase', true);
      return add.mutateAsync(asset);
    },
    [add, addressToUse]
  );
  const removeShowcaseToken = useCallback((asset: string) => remove.mutateAsync(asset), [remove]);

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
    isLoading: add.isLoading || remove.isLoading || isLoadingShowcaseTokens,
  };
}

export function useHiddenTokens(address?: string) {
  const accountAddress = useAccountAddress();
  const addressToUse = address || accountAddress;
  const { data: hiddenTokens = [] } = useFetchHiddenTokens({ address: addressToUse });

  const trackToggled = (asset: UniqueAsset, isHidden: boolean) =>
    analytics.track(analytics.event.toggledAnNFTAsHidden, {
      collectionContractAddress: asset.contractAddress,
      collectionName: asset.collectionName,
      isHidden,
    });

  const add = useProfileTokenListMutation<UniqueAsset>({
    category: 'hidden',
    address: addressToUse,
    computeNext: (current, asset) => [...current, asset.uniqueId.toLowerCase()],
    onWriteSuccess: asset => trackToggled(asset, true),
  });
  const remove = useProfileTokenListMutation<UniqueAsset>({
    category: 'hidden',
    address: addressToUse,
    computeNext: (current, asset) => current.filter(id => id !== asset.uniqueId.toLowerCase()),
    onWriteSuccess: asset => trackToggled(asset, false),
  });

  const addHiddenToken = useCallback((asset: UniqueAsset) => add.mutateAsync(asset), [add]);
  const removeHiddenToken = useCallback((asset: UniqueAsset) => remove.mutateAsync(asset), [remove]);

  return {
    addHiddenToken,
    hiddenTokens,
    removeHiddenToken,
    isLoading: add.isLoading || remove.isLoading,
  };
}
