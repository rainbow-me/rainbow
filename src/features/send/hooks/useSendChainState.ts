import { useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';

import { getProvider, isL2Chain } from '@/handlers/web3';
import usePrevious from '@/hooks/usePrevious';
import { ChainId } from '@/state/backendNetworks/types';

type UseSendChainStateParams = {
  accountChainId: ChainId;
  selectedAssetChainId: ChainId | undefined;
  startPollingGasFees: (chainId: ChainId) => void;
  stopPollingGasFees: () => void;
};

type UseSendChainStateResult = {
  currentChainId: ChainId;
  currentProvider: StaticJsonRpcProvider | undefined;
  isL2: boolean;
};

export function useSendChainState({
  accountChainId,
  selectedAssetChainId,
  startPollingGasFees,
  stopPollingGasFees,
}: UseSendChainStateParams): UseSendChainStateResult {
  const [currentChainId, setCurrentChainId] = useState<ChainId>(ChainId.mainnet);
  const prevChainId = usePrevious(currentChainId);
  const [currentProvider, setCurrentProvider] = useState<StaticJsonRpcProvider | undefined>(getProvider({ chainId: ChainId.mainnet }));

  const isL2 = useMemo(() => isL2Chain({ chainId: currentChainId }), [currentChainId]);

  useEffect(() => {
    if (prevChainId !== currentChainId) {
      InteractionManager.runAfterInteractions(() => {
        startPollingGasFees(currentChainId);
      });
    }
  }, [startPollingGasFees, prevChainId, currentChainId]);

  useEffect(() => {
    return () => {
      InteractionManager.runAfterInteractions(() => {
        stopPollingGasFees();
      });
    };
  }, [currentChainId, stopPollingGasFees]);

  useEffect(() => {
    if (selectedAssetChainId && (selectedAssetChainId !== currentChainId || !currentChainId || prevChainId !== currentChainId)) {
      if (accountChainId === ChainId.goerli) {
        setCurrentChainId(ChainId.goerli);
        const provider = getProvider({ chainId: ChainId.goerli });
        setCurrentProvider(provider);
      } else {
        setCurrentChainId(selectedAssetChainId);
        const provider = getProvider({ chainId: currentChainId });
        setCurrentProvider(provider);
      }
    }
  }, [currentChainId, accountChainId, prevChainId, selectedAssetChainId]);

  return {
    currentChainId,
    currentProvider,
    isL2,
  };
}
