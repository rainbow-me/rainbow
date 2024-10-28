import React, { useState } from 'react';
import { Claimable, ClaimResponse, SponsoredClaimable } from '@/resources/addys/claimables/types';
import { ClaimingClaimableSharedUI, ClaimStatus } from './ClaimingClaimableSharedUI';
import { logger, RainbowError } from '@/logger';
import { queryClient } from '@/react-query';
import { ADDYS_BASE_URL, addysHttp, claimablesQueryKey } from '@/resources/addys/claimables/query';
import { loadWallet } from '@/model/wallet';
import { useMutation } from '@tanstack/react-query';
import { getProvider } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { haptics } from '@/utils';
import { analyticsV2 } from '@/analytics';

enum ErrorMessages {
  CLAIM_API_CALL_FAILED = 'Failed to execute sponsored claim api call',
  CLAIM_API_UNSUCCESSFUL_RESPONSE = 'Sponsored claim api call returned unsuccessful response',
  UNHANDLED_ERROR = 'Failed to claim claimable due to unhandled error',
  UNREACHABLE_CLAIM_STATE = 'Claim function completed but never resolved status to success or error state',
}

export const ClaimingSponsoredClaimable = ({ claimable }: { claimable: SponsoredClaimable }) => {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('idle');

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
          analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
            claimableType: 'sponsored',
            claimableId: claimable.uniqueId,
            chainId: claimable.chainId,
            asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            amount: claimable.value.claimAsset.amount,
            usdValue: claimable.value.usd,
            errorMessage: ErrorMessages.CLAIM_API_CALL_FAILED,
          });
          logger.error(new RainbowError(`[ClaimSponsoredClaimable]: ${ErrorMessages.CLAIM_API_CALL_FAILED}`));
          return;
        }
      } else {
        try {
          response = await addysHttp.post(path);
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('error');
          analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
            claimableType: 'sponsored',
            claimableId: claimable.uniqueId,
            chainId: claimable.chainId,
            asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            amount: claimable.value.claimAsset.amount,
            usdValue: claimable.value.usd,
            errorMessage: ErrorMessages.CLAIM_API_CALL_FAILED,
          });
          logger.error(new RainbowError(`[ClaimSponsoredClaimable]: ${ErrorMessages.CLAIM_API_CALL_FAILED}`));
          return;
        }
      }

      if (!response.data.payload.success) {
        haptics.notificationError();
        setClaimStatus('error');
        analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
          claimableType: 'sponsored',
          claimableId: claimable.uniqueId,
          chainId: claimable.chainId,
          asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          amount: claimable.value.claimAsset.amount,
          usdValue: claimable.value.usd,
          errorMessage: ErrorMessages.CLAIM_API_UNSUCCESSFUL_RESPONSE,
        });
        logger.error(new RainbowError(`[ClaimSponsoredClaimable]: ${ErrorMessages.CLAIM_API_UNSUCCESSFUL_RESPONSE}`));
      } else {
        haptics.notificationSuccess();

        if (response.data.payload.claim_transaction_status?.transaction_hash) {
          setClaimStatus('success');
        } else {
          setClaimStatus('pending');
        }

        analyticsV2.track(analyticsV2.event.claimClaimableSucceeded, {
          claimableType: 'sponsored',
          claimableId: claimable.uniqueId,
          chainId: claimable.chainId,
          asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          amount: claimable.value.claimAsset.amount,
          usdValue: claimable.value.usd,
        });

        // Immediately remove the claimable from cached data
        queryClient.setQueryData(queryKey, (oldData: Claimable[] | undefined) => oldData?.filter(c => c.uniqueId !== claimable.uniqueId));
      }
    },
    onError: e => {
      haptics.notificationError();
      setClaimStatus('error');
      analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
        claimableType: 'sponsored',
        claimableId: claimable.uniqueId,
        chainId: claimable.chainId,
        asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
        amount: claimable.value.claimAsset.amount,
        usdValue: claimable.value.usd,
        errorMessage: ErrorMessages.UNHANDLED_ERROR,
      });
      logger.error(new RainbowError(`[ClaimSponsoredClaimable]: ${ErrorMessages.UNHANDLED_ERROR}`), {
        message: (e as Error)?.message,
      });
    },
    onSuccess: () => {
      if (claimStatus === 'claiming') {
        haptics.notificationError();
        setClaimStatus('error');
        analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
          claimableType: 'sponsored',
          claimableId: claimable.uniqueId,
          chainId: claimable.chainId,
          asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          amount: claimable.value.claimAsset.amount,
          usdValue: claimable.value.usd,
          errorMessage: ErrorMessages.UNREACHABLE_CLAIM_STATE,
        });
        logger.error(new RainbowError(`[ClaimSponsoredClaimable]: ${ErrorMessages.UNREACHABLE_CLAIM_STATE}`));
      }
    },
    onSettled: () => {
      // Clear and refresh claimables data 20s after claim button is pressed, regardless of success or failure
      setTimeout(() => queryClient.invalidateQueries(queryKey), 20_000);
    },
  });

  return (
    <ClaimingClaimableSharedUI claim={claimClaimable} claimable={claimable} claimStatus={claimStatus} setClaimStatus={setClaimStatus} />
  );
};
