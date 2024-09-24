import React, { useState } from 'react';
import { useAccountSettings } from '@/hooks';
import { SponsoredClaimable } from '@/resources/addys/claimables/types';
import { claimablesQueryKey, useClaimables } from '@/resources/addys/claimables/query';
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { walletExecuteRapV2 } from '@/raps/execute';
import { queryClient } from '@/react-query';
import { ClaimingClaimableSharedUI, ClaimStatus } from './ClaimingClaimableSharedUI';

export const ClaimingSponsoredClaimable = ({ claimable }: { claimable: SponsoredClaimable }) => {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const { refetch } = useClaimables({ address: accountAddress, currency: nativeCurrency });

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('idle');

  const { mutate: claimClaimable } = useMutation({
    mutationFn: async () => {
      const provider = getProvider({ chainId: claimable.chainId });
      const wallet = await loadWallet({
        address: accountAddress,
        showErrorIfNotLoaded: true,
        provider,
      });

      if (!wallet) {
        // Biometrics auth failure (retry possible)
        setClaimStatus('error');
        return;
      }

      try {
        const { errorMessage } = await walletExecuteRapV2(wallet, {
          type: 'claimSponsoredClaimableRap',
          claimSponsoredClaimableActionParameters: { url: claimable.action.url, method: claimable.action.method as 'POST' | 'GET' },
        });

        if (errorMessage) {
          setClaimStatus('error');
          logger.error(new RainbowError('[ClaimingSponsoredClaimable]: Failed to claim claimable due to rap error'), {
            message: errorMessage,
          });
        } else {
          setClaimStatus('success');
          // Clear and refresh claimables data
          queryClient.invalidateQueries(claimablesQueryKey({ address: accountAddress, currency: nativeCurrency }));
          refetch();
        }
      } catch (e) {
        logger.error(new RainbowError('[ClaimingSponsoredClaimable]: Failed to claim claimable due to unknown error'), {
          message: (e as Error)?.message,
        });
      }
    },
    onError: e => {
      setClaimStatus('error');
      logger.error(new RainbowError('[ClaimingSponsoredClaimable]: Failed to claim claimable due to unhandled error'), {
        message: (e as Error)?.message,
      });
    },
  });

  return (
    <ClaimingClaimableSharedUI claim={claimClaimable} claimable={claimable} claimStatus={claimStatus} setClaimStatus={setClaimStatus} />
  );
};
