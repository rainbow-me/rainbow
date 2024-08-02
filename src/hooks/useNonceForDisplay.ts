import { useEffect, useState } from 'react';
import { Network } from '@/networks/types';
import { getNextNonce } from '@/state/nonces';

type UseNonceParams = {
  isMessageRequest: boolean;
  currentAddress: string;
  currentNetwork: Network;
};

export const useNonceForDisplay = ({ isMessageRequest, currentAddress, currentNetwork }: UseNonceParams) => {
  const [nonceForDisplay, setNonceForDisplay] = useState<string>();

  useEffect(() => {
    if (!isMessageRequest && !nonceForDisplay) {
      (async () => {
        try {
          const nonce = await getNextNonce({ address: currentAddress, network: currentNetwork });
          if (nonce || nonce === 0) {
            const nonceAsString = nonce.toString();
            setNonceForDisplay(nonceAsString);
          }
        } catch (error) {
          console.error('Failed to get nonce for display:', error);
        }
      })();
    }
  }, [currentAddress, currentNetwork, isMessageRequest, nonceForDisplay]);

  return { nonceForDisplay };
};
