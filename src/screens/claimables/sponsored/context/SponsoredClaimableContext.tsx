import React, { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';
import { Claimable, ClaimResponse, SponsoredClaimable } from '@/resources/addys/claimables/types';
import { logger, RainbowError } from '@/logger';
import { useAccountSettings } from '@/hooks';
import { getProvider } from '@/handlers/web3';
import { haptics } from '@/utils';
import { queryClient } from '@/react-query';
import { ADDYS_BASE_URL, addysHttp, claimablesQueryKey } from '@/resources/addys/claimables/query';
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { ClaimStatus } from '../../shared/types';
import { analyticsV2 } from '@/analytics';

enum ErrorMessages {
  CLAIM_API_CALL_FAILED = 'Failed to execute sponsored claim api call',
  CLAIM_API_UNSUCCESSFUL_RESPONSE = 'Sponsored claim api call returned unsuccessful response',
  UNHANDLED_ERROR = 'Failed to claim claimable due to unhandled error',
  UNRESOLVED_CLAIM_STATUS = 'Claim function completed but never resolved status to success or error state',
}

type SponsoredClaimableContextType = {
  claimStatus: ClaimStatus;
  claimable: Claimable;

  setClaimStatus: Dispatch<SetStateAction<ClaimStatus>>;

  claim: () => void;
};

const SponsoredClaimableContext = createContext<SponsoredClaimableContextType | undefined>(undefined);

export function useSponsoredClaimableContext() {
  const context = useContext(SponsoredClaimableContext);
  if (context === undefined) {
    throw new Error('useSponsoredClaimableContext must be used within a SponsoredClaimableContextProvider');
  }
  return context;
}

export function SponsoredClaimableContextProvider({ claimable, children }: { claimable: SponsoredClaimable; children: React.ReactNode }) {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('ready');

  const queryKey = claimablesQueryKey({ address: accountAddress, currency: nativeCurrency });

  const { mutate: claim } = useMutation({
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
        setClaimStatus('recoverableError');
        return;
      }

      const path = claimable.action.url.replace(ADDYS_BASE_URL, '');
      let response: { data: ClaimResponse };

      if (claimable.action.method === 'GET') {
        try {
          response = await addysHttp.get(path);
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('recoverableError');
          logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.CLAIM_API_CALL_FAILED}`));
          analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
            claimableType: 'sponsored',
            claimableId: claimable.analyticsId,
            chainId: claimable.chainId,
            asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            amount: claimable.value.claimAsset.amount,
            isSwapping: false,
            outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            outputChainId: claimable.chainId,
            usdValue: claimable.value.usd,
            failureStep: 'claim',
            errorMessage: ErrorMessages.CLAIM_API_CALL_FAILED,
          });
          return;
        }
      } else {
        try {
          response = await addysHttp.post(path);
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('recoverableError');
          logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.CLAIM_API_CALL_FAILED}`));
          analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
            claimableType: 'sponsored',
            claimableId: claimable.analyticsId,
            chainId: claimable.chainId,
            asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            amount: claimable.value.claimAsset.amount,
            isSwapping: false,
            outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            outputChainId: claimable.chainId,
            failureStep: 'claim',
            usdValue: claimable.value.usd,
            errorMessage: ErrorMessages.CLAIM_API_CALL_FAILED,
          });
          return;
        }
      }

      if (!response.data.payload.success) {
        haptics.notificationError();
        setClaimStatus('recoverableError');
        logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.CLAIM_API_UNSUCCESSFUL_RESPONSE}`));
        analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
          claimableType: 'sponsored',
          claimableId: claimable.analyticsId,
          chainId: claimable.chainId,
          asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          amount: claimable.value.claimAsset.amount,
          isSwapping: false,
          outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          outputChainId: claimable.chainId,
          failureStep: 'claim',
          usdValue: claimable.value.usd,
          errorMessage: ErrorMessages.CLAIM_API_UNSUCCESSFUL_RESPONSE,
        });
      } else {
        haptics.notificationSuccess();

        if (response.data.payload.claim_transaction_status?.transaction_hash) {
          setClaimStatus('success');
        } else {
          setClaimStatus('pending');
        }

        analyticsV2.track(analyticsV2.event.claimClaimableSucceeded, {
          claimableType: 'sponsored',
          claimableId: claimable.analyticsId,
          chainId: claimable.chainId,
          asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          amount: claimable.value.claimAsset.amount,
          usdValue: claimable.value.usd,
          isSwapping: false,
          outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          outputChainId: claimable.chainId,
        });

        // Immediately remove the claimable from cached data
        queryClient.setQueryData(queryKey, (oldData: Claimable[] | undefined) => oldData?.filter(c => c.uniqueId !== claimable.uniqueId));
      }
    },
    onError: e => {
      haptics.notificationError();
      setClaimStatus('recoverableError');
      logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.UNHANDLED_ERROR}`), {
        message: (e as Error)?.message,
      });
      analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
        claimableType: 'sponsored',
        claimableId: claimable.analyticsId,
        chainId: claimable.chainId,
        asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
        amount: claimable.value.claimAsset.amount,
        usdValue: claimable.value.usd,
        isSwapping: false,
        outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
        outputChainId: claimable.chainId,
        failureStep: 'unknown',
        errorMessage: ErrorMessages.UNHANDLED_ERROR,
      });
    },
    onSuccess: () => {
      if (claimStatus === 'claiming') {
        haptics.notificationError();
        setClaimStatus('recoverableError');
        logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.UNRESOLVED_CLAIM_STATUS}`));
        analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
          claimableType: 'sponsored',
          claimableId: claimable.analyticsId,
          chainId: claimable.chainId,
          asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          amount: claimable.value.claimAsset.amount,
          usdValue: claimable.value.usd,
          isSwapping: false,
          outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          outputChainId: claimable.chainId,
          failureStep: 'unknown',
          errorMessage: ErrorMessages.UNRESOLVED_CLAIM_STATUS,
        });
      }
    },
    onSettled: () => {
      // Clear and refresh claimables data 20s after claim button is pressed, regardless of success or failure
      setTimeout(() => queryClient.invalidateQueries(queryKey), 20_000);
    },
  });

  return (
    <SponsoredClaimableContext.Provider
      value={{
        claimStatus,
        claimable,

        setClaimStatus,

        claim,
      }}
    >
      {children}
    </SponsoredClaimableContext.Provider>
  );
}
