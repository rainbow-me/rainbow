import { useCallback } from 'react';
import { getIsReadOnlyWallet, useAccountAddress } from '@/state/wallets/walletsStore';
import { useMutation } from '@tanstack/react-query';
import useFetchShowcaseTokens, { showcaseTokensQueryKey } from './useFetchShowcaseTokens';
import { getPreference, PreferenceActionType, setPreference } from '@/model/preferences';
import { isLowerCaseMatch } from '@/utils';
import { queryClient } from '@/react-query';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';

export default function useShowcaseTokens(address?: string) {
  const accountAddress = useAccountAddress();

  const addressToUse = address || accountAddress;

  const { data: showcaseTokens = [], isLoading: isLoadingShowcaseTokens } = useFetchShowcaseTokens({ address: addressToUse });

  const addShowcaseTokenMutation = useMutation({
    mutationFn: async (asset: string) => {
      const isReadOnlyWallet = getIsReadOnlyWallet();
      if (isReadOnlyWallet) return showcaseTokens;

      const lowercasedUniqueId = asset.toLowerCase();
      const newShowcaseTokens = [...showcaseTokens, lowercasedUniqueId];
      const response = await getPreference('showcase', addressToUse);
      if (!response || !response.showcase.ids.length) {
        await setPreference(PreferenceActionType.init, 'showcase', addressToUse, newShowcaseTokens);
      } else {
        await setPreference(PreferenceActionType.update, 'showcase', addressToUse, newShowcaseTokens);
      }

      return newShowcaseTokens;
    },
    onMutate: async (asset: string) => {
      await queryClient.cancelQueries({ queryKey: showcaseTokensQueryKey({ address: addressToUse }) });

      const previousShowcaseTokens = queryClient.getQueryData(showcaseTokensQueryKey({ address: addressToUse })) || [];

      const newShowcaseTokens = [...(previousShowcaseTokens as string[]), asset];
      queryClient.setQueryData(showcaseTokensQueryKey({ address: addressToUse }), newShowcaseTokens);

      return { previousShowcaseTokens };
    },
    onError: (err, asset, context) => {
      queryClient.setQueryData(showcaseTokensQueryKey({ address: addressToUse }), context?.previousShowcaseTokens);
    },
  });

  const removeShowcaseTokenMutation = useMutation({
    mutationFn: async (asset: string) => {
      const isReadOnlyWallet = getIsReadOnlyWallet();
      if (isReadOnlyWallet) return showcaseTokens;

      const lowercasedUniqueId = asset.toLowerCase();
      const newShowcaseTokens = showcaseTokens.filter(id => {
        if (isLowerCaseMatch(id, lowercasedUniqueId)) return false;
        return true;
      });

      const response = await getPreference('showcase', addressToUse);
      if (!response || !response.showcase.ids.length) {
        await setPreference(PreferenceActionType.init, 'showcase', addressToUse, newShowcaseTokens);
      } else {
        await setPreference(PreferenceActionType.update, 'showcase', addressToUse, newShowcaseTokens);
      }

      return newShowcaseTokens;
    },
    onMutate: async (asset: string) => {
      await queryClient.cancelQueries({ queryKey: showcaseTokensQueryKey({ address: addressToUse }) });

      const previousShowcaseTokens = queryClient.getQueryData(showcaseTokensQueryKey({ address: addressToUse })) || [];

      const newShowcaseTokens = (previousShowcaseTokens as string[]).filter((id: string) => id !== asset);
      queryClient.setQueryData(showcaseTokensQueryKey({ address: addressToUse }), newShowcaseTokens);

      return { previousShowcaseTokens };
    },
    onError: (err, asset, context) => {
      queryClient.setQueryData(showcaseTokensQueryKey({ address: addressToUse }), context?.previousShowcaseTokens);
    },
  });

  const addShowcaseToken = useCallback(
    async (asset: string) => {
      useOpenCollectionsStore.getState(addressToUse).setCollectionOpen('showcase', true);
      return addShowcaseTokenMutation.mutateAsync(asset);
    },
    [addShowcaseTokenMutation, addressToUse]
  );

  const removeShowcaseToken = useCallback(
    async (asset: string) => {
      return removeShowcaseTokenMutation.mutateAsync(asset);
    },
    [removeShowcaseTokenMutation]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
    isLoading: addShowcaseTokenMutation.isLoading || removeShowcaseTokenMutation.isLoading || isLoadingShowcaseTokens,
  };
}
