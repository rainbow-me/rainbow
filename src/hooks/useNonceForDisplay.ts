import { useEffect, useState } from 'react';
import { getNextNonce } from '@/state/nonces';
import { ChainId } from '@/networks/types';

type UseNonceParams = {
  isMessageRequest: boolean;
  address: string;
  chainId: ChainId;
};

export const useNonceForDisplay = ({ isMessageRequest, address, chainId }: UseNonceParams) => {
  const [nonceForDisplay, setNonceForDisplay] = useState<string>();

  useEffect(() => {
    if (!isMessageRequest && !nonceForDisplay) {
      (async () => {
        try {
          const nonce = await getNextNonce({ address, chainId });
          if (nonce || nonce === 0) {
            const nonceAsString = nonce.toString();
            setNonceForDisplay(nonceAsString);
          }
        } catch (error) {
          console.error('Failed to get nonce for display:', error);
        }
      })();
    }
  }, [address, chainId, isMessageRequest, nonceForDisplay]);

  return { nonceForDisplay };
};
