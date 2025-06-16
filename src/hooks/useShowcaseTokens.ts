import { useCallback } from 'react';
import { useIsReadOnlyWallet, useAccountAddress } from '@/state/wallets/walletsStore';
import useOpenFamilies from './useOpenFamilies';
import useWebData from './useWebData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useFetchShowcaseTokens, { showcaseTokensQueryKey } from './useFetchShowcaseTokens';
import { saveShowcaseTokens } from '@/handlers/localstorage/accountLocal';
import useAccountSettings from './useAccountSettings';
import { logger } from '@/logger';

export default function useShowcaseTokens(address?: string) {
  const queryClient = useQueryClient();
  const { updateWebShowcase } = useWebData();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const { updateOpenFamilies } = useOpenFamilies();
  const accountAddress = useAccountAddress();
  const { network } = useAccountSettings();

  const addressToUse = address || accountAddress;

  const { data: showcaseTokens = [] } = useFetchShowcaseTokens({ address: addressToUse });

  const addShowcaseTokenMutation = useMutation({
    mutationFn: async (asset: string) => {
      logger.debug('[useShowcaseTokens] Adding showcase token:', {
        asset,
        addressToUse,
        network,
        isReadOnlyWallet,
        currentShowcaseTokens: showcaseTokens,
      });

      const newShowcaseTokens = [...showcaseTokens, asset];
      logger.debug(`[useShowcaseTokens] New showcase tokens: ${newShowcaseTokens}`);

      saveShowcaseTokens(newShowcaseTokens, addressToUse, network);
      logger.debug('[useShowcaseTokens] Saved showcase tokens to local storage');

      if (!isReadOnlyWallet) {
        await updateWebShowcase(newShowcaseTokens);
        logger.debug('[useShowcaseTokens] Updated web showcase');
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
      const newShowcaseTokens = showcaseTokens.filter((id: string) => id !== asset);
      saveShowcaseTokens(newShowcaseTokens, addressToUse, network);
      !isReadOnlyWallet && updateWebShowcase(newShowcaseTokens);
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
      updateOpenFamilies({ Showcase: true });
      return addShowcaseTokenMutation.mutateAsync(asset);
    },
    [addShowcaseTokenMutation, updateOpenFamilies]
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
    isLoading: addShowcaseTokenMutation.isLoading || removeShowcaseTokenMutation.isLoading,
  };
}
