import { useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';

import { ChainId } from '@/features/network/types/backendNetworks';
import { getProvider, isL2Chain } from '@/handlers/web3';

type UseSendChainStateParams = {
  selectedAssetChainId: ChainId | undefined;
  startPollingGasFees: (chainId: ChainId) => void;
  stopPollingGasFees: () => void;
};

type UseSendChainStateResult = {
  currentChainId: ChainId;
  currentProvider: StaticJsonRpcProvider;
  isL2: boolean;
};

/**
 * Resolves the send chain and provider and polls its gas fees while mounted.
 */
export function useSendChainState({
  selectedAssetChainId,
  startPollingGasFees,
  stopPollingGasFees,
}: UseSendChainStateParams): UseSendChainStateResult {
  const currentChainId = selectedAssetChainId ?? ChainId.mainnet;
  const currentProvider = useMemo(() => getProvider({ chainId: currentChainId }), [currentChainId]);
  const isL2 = useMemo(() => isL2Chain({ chainId: currentChainId }), [currentChainId]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      startPollingGasFees(currentChainId);
    });
    return () => {
      InteractionManager.runAfterInteractions(() => {
        stopPollingGasFees();
      });
    };
  }, [currentChainId, startPollingGasFees, stopPollingGasFees]);

  return {
    currentChainId,
    currentProvider,
    isL2,
  };
}
