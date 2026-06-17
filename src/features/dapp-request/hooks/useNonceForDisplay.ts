import { useEffect, useState } from 'react';

import { type ChainId } from '@/features/network/types/backendNetworks';
import { logger, RainbowError } from '@/logger';
import { getNextNonce } from '@/state/nonces';

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
          logger.error(new RainbowError(`[useNonceForDisplay]: Failed to get nonce for display: ${error}`));
        }
      })();
    }
  }, [address, chainId, isMessageRequest, nonceForDisplay]);

  return { nonceForDisplay };
};
