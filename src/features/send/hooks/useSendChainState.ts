import { useEffect, useMemo } from 'react';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';

import { getProvider, isL2Chain } from '@/handlers/web3';
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
  const chainState = useMemo(() => {
    const selectedChainId = selectedAssetChainId && accountChainId === ChainId.goerli ? ChainId.goerli : selectedAssetChainId;
    const currentChainId = selectedChainId ?? ChainId.mainnet;

    return {
      currentChainId,
      currentProvider: getProvider({ chainId: currentChainId }),
      isL2: isL2Chain({ chainId: currentChainId }),
    };
  }, [accountChainId, selectedAssetChainId]);

  useEffect(() => {
    startPollingGasFees(chainState.currentChainId);
    return () => {
      stopPollingGasFees();
    };
  }, [chainState.currentChainId, startPollingGasFees, stopPollingGasFees]);

  return chainState;
}
