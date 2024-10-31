import React, { useState } from 'react';
import { Claimable, ClaimResponse, SponsoredClaimable } from '@/resources/addys/claimables/types';
import { logger, RainbowError } from '@/logger';
import { queryClient } from '@/react-query';
import { ADDYS_BASE_URL, addysHttp, claimablesQueryKey } from '@/resources/addys/claimables/query';
import { loadWallet } from '@/model/wallet';
import { useMutation } from '@tanstack/react-query';
import { getProvider } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { haptics } from '@/utils';
import { ClaimPanel } from './ClaimPanel';
import { ClaimValueDisplay } from './ClaimValueDisplay';
import { ClaimButton } from './ClaimButton';
import { ClaimStatus } from '../types';
import { useClaimContext } from './ClaimContext';

export function SponsoredClaimablePanel() {
  const {
    claimable,
    outputConfig: { chainId: outputChainId, token: outputToken },
    claimStatus,
    setClaimStatus,
  } = useClaimContext();

  if (claimable.type !== 'sponsored') {
    throw new RainbowError('[SponsoredClaimablePanel]: Claimable is not of type "sponsored"');
  }

  const { accountAddress, nativeCurrency } = useAccountSettings();

  const queryKey = claimablesQueryKey({ address: accountAddress, currency: nativeCurrency });

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
        haptics.notificationSuccess();

        if (response.data.payload.claim_transaction_status?.transaction_hash) {
          setClaimStatus('success');
        } else {
          setClaimStatus('pending');
        }

        // Immediately remove the claimable from cached data
        queryClient.setQueryData(queryKey, (oldData: Claimable[] | undefined) => oldData?.filter(c => c.uniqueId !== claimable.uniqueId));
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
    onSettled: () => {
      // Clear and refresh claimables data 20s after claim button is pressed, regardless of success or failure
      setTimeout(() => queryClient.invalidateQueries(queryKey), 20_000);
    },
  });

  return (
    <ClaimPanel claimStatus={claimStatus} iconUrl={claimable.iconUrl}>
      <ClaimValueDisplay nativeValueDisplay={claimable.value.nativeAsset.display} />
      <ClaimButton claim={claimClaimable} claimValueDisplay={claimable.value.claimAsset.display} />
    </ClaimPanel>
  );
}
