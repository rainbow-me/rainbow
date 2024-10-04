import React, { useState } from 'react';
import { ClaimResponse, SponsoredClaimable } from '@/resources/addys/claimables/types';
import { ClaimingClaimableSharedUI, ClaimStatus } from './ClaimingClaimableSharedUI';
import { logger, RainbowError } from '@/logger';
import { queryClient } from '@/react-query';
import { ADDYS_BASE_URL, addysHttp, claimablesQueryKey } from '@/resources/addys/claimables/query';
import { loadWallet } from '@/model/wallet';
import { useMutation } from '@tanstack/react-query';
import { getProvider } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { haptics } from '@/utils';

export const ClaimingSponsoredClaimable = ({ claimable }: { claimable: SponsoredClaimable }) => {
  const { accountAddress, nativeCurrency } = useAccountSettings();

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
        haptics.notificationError();
        setClaimStatus('error');
        return;
      }

      const path = claimable.action.url.replace(ADDYS_BASE_URL, '');
      let response: { data: ClaimResponse };

      if (claimable.action.method === 'GET') {
        try {
          response = await addysHttp.get(path);
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('error');
          logger.error(new RainbowError('[ClaimSponsoredClaimable]: failed to execute sponsored claim api call'));
          return;
        }
      } else {
        try {
          response = await addysHttp.post(path);
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('error');
          logger.error(new RainbowError('[ClaimSponsoredClaimable]: failed to execute sponsored claim api call'));
          return;
        }
      }

      if (!response.data.payload.success) {
        haptics.notificationError();
        setClaimStatus('error');
        logger.error(new RainbowError('[ClaimSponsoredClaimable]: sponsored claim api call returned unsuccessful response'));
      } else {
        if (response.data.payload.claim_transaction_status?.transaction_hash) {
          haptics.notificationSuccess();
          setClaimStatus('success');
        } else {
          haptics.notificationSuccess();
          setClaimStatus('pending');
        }
        // Clear and refresh claimables data
        queryClient.invalidateQueries(claimablesQueryKey({ address: accountAddress, currency: nativeCurrency }));
      }
    },
    onError: e => {
      haptics.notificationError();
      setClaimStatus('error');
      logger.error(new RainbowError('[ClaimingSponsoredClaimable]: Failed to claim claimable due to unhandled error'), {
        message: (e as Error)?.message,
      });
    },
    onSuccess: () => {
      if (claimStatus === 'claiming') {
        haptics.notificationError();
        setClaimStatus('error');
        logger.error(
          new RainbowError('[ClaimingSponsoredClaimable]: claim function completed but never resolved status to success or error state')
        );
      }
    },
  });

  return (
    <ClaimingClaimableSharedUI claim={claimClaimable} claimable={claimable} claimStatus={claimStatus} setClaimStatus={setClaimStatus} />
  );
};
