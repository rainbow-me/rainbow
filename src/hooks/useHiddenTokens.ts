import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analytics } from '@/analytics';
import { UniqueAsset } from '@/entities';
import { useAccountAddress, getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import useFetchHiddenTokens, { getHidden, hiddenTokensQueryKey } from './useFetchHiddenTokens';
import { PreferenceActionType, setPreference } from '@/model/preferences';
import { logger } from '@/logger';

export default function useHiddenTokens(address?: string) {
  const queryClient = useQueryClient();
  const accountAddress = useAccountAddress();
  const addressToUse = address || accountAddress;

  const { data: hiddenTokens = [] } = useFetchHiddenTokens({ address: addressToUse });

  const addHiddenTokenMutation = useMutation({
    mutationFn: async (asset: UniqueAsset) => {
      const isReadOnlyWallet = getIsReadOnlyWallet();
      if (isReadOnlyWallet) return hiddenTokens;

      const lowercasedUniqueId = asset.uniqueId.toLowerCase();
      logger.debug('[useHiddenTokens] Adding hidden token', {
        asset: lowercasedUniqueId,
        addressToUse,
        isReadOnlyWallet,
        currentHiddenTokens: hiddenTokens,
      });

      const newHiddenTokens = [...hiddenTokens, lowercasedUniqueId];
      logger.debug(`[useHiddenTokens] New hidden tokens: ${newHiddenTokens}`);

      const response = await getHidden(addressToUse);
      if (!response.length) {
        logger.debug('[useHiddenTokens] Initializing hidden tokens');
        await setPreference(PreferenceActionType.init, 'hidden', addressToUse, newHiddenTokens);
      } else {
        logger.debug(`[useHiddenTokens] Adding hidden token ${lowercasedUniqueId} to hidden tokens`);
        await setPreference(PreferenceActionType.update, 'hidden', addressToUse, newHiddenTokens);
      }

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.contractAddress,
        collectionName: asset.collectionName,
        isHidden: true,
      });

      return newHiddenTokens;
    },
    onMutate: async (asset: UniqueAsset) => {
      const lowercasedUniqueId = asset.uniqueId.toLowerCase();

      await queryClient.cancelQueries({ queryKey: hiddenTokensQueryKey({ address: addressToUse }) });

      const previousHiddenTokens = queryClient.getQueryData(hiddenTokensQueryKey({ address: addressToUse })) || [];

      const newHiddenTokens = [...(previousHiddenTokens as string[]), lowercasedUniqueId];
      queryClient.setQueryData(hiddenTokensQueryKey({ address: addressToUse }), newHiddenTokens);

      return { previousHiddenTokens };
    },
    onError: (err, asset, context) => {
      queryClient.setQueryData(hiddenTokensQueryKey({ address: addressToUse }), context?.previousHiddenTokens);
    },
  });

  const removeHiddenTokenMutation = useMutation({
    mutationFn: async (asset: UniqueAsset) => {
      const isReadOnlyWallet = getIsReadOnlyWallet();
      if (isReadOnlyWallet) return hiddenTokens;

      const lowercasedUniqueId = asset.uniqueId.toLowerCase();
      logger.debug('[useHiddenTokens] Removing hidden token', {
        asset: lowercasedUniqueId,
        addressToUse,
        isReadOnlyWallet,
        currentHiddenTokens: hiddenTokens,
      });

      const newHiddenTokens = hiddenTokens.filter(id => id !== lowercasedUniqueId);
      logger.debug(`[useHiddenTokens] New hidden tokens: ${newHiddenTokens}`);

      const response = await getHidden(addressToUse);
      if (!response.length) {
        logger.debug('[useHiddenTokens] Initializing hidden tokens');
        await setPreference(PreferenceActionType.init, 'hidden', addressToUse, newHiddenTokens);
      } else {
        logger.debug(`[useHiddenTokens] Removing hidden token ${lowercasedUniqueId} from hidden tokens`);
        await setPreference(PreferenceActionType.update, 'hidden', addressToUse, newHiddenTokens);
      }

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.contractAddress,
        collectionName: asset.collectionName,
        isHidden: false,
      });

      return newHiddenTokens;
    },
    onMutate: async (asset: UniqueAsset) => {
      const lowercasedUniqueId = asset.uniqueId.toLowerCase();

      await queryClient.cancelQueries({ queryKey: hiddenTokensQueryKey({ address: addressToUse }) });

      const previousHiddenTokens = queryClient.getQueryData(hiddenTokensQueryKey({ address: addressToUse })) || [];

      const newHiddenTokens = (previousHiddenTokens as string[]).filter(id => id !== lowercasedUniqueId);
      queryClient.setQueryData(hiddenTokensQueryKey({ address: addressToUse }), newHiddenTokens);

      return { previousHiddenTokens };
    },
    onError: (err, asset, context) => {
      queryClient.setQueryData(hiddenTokensQueryKey({ address: addressToUse }), context?.previousHiddenTokens);
    },
  });

  const addHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      return addHiddenTokenMutation.mutateAsync(asset);
    },
    [addHiddenTokenMutation]
  );

  const removeHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      return removeHiddenTokenMutation.mutateAsync(asset);
    },
    [removeHiddenTokenMutation]
  );

  return {
    addHiddenToken,
    hiddenTokens,
    removeHiddenToken,
    isLoading: addHiddenTokenMutation.isLoading || removeHiddenTokenMutation.isLoading,
  };
}
