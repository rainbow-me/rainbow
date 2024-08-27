import { useEffect, useState } from 'react';
import { getNextNonce } from '@/state/nonces';
import { ChainId } from '@/__swaps__/types/chains';
import { ethereumUtils } from '@/utils';

type UseNonceParams = {
  isMessageRequest: boolean;
  currentAddress: string;
  currentChainId: ChainId;
};

export const useNonceForDisplay = ({ isMessageRequest, currentAddress, currentChainId }: UseNonceParams) => {
  const [nonceForDisplay, setNonceForDisplay] = useState<string>();

  useEffect(() => {
    if (!isMessageRequest && !nonceForDisplay) {
      (async () => {
        try {
          const nonce = await getNextNonce({ address: currentAddress, network: ethereumUtils.getNetworkFromChainId(currentChainId) });
          if (nonce || nonce === 0) {
            const nonceAsString = nonce.toString();
            setNonceForDisplay(nonceAsString);
          }
        } catch (error) {
          console.error('Failed to get nonce for display:', error);
        }
      })();
    }
  }, [currentAddress, currentChainId, isMessageRequest, nonceForDisplay]);

  return { nonceForDisplay };
};
