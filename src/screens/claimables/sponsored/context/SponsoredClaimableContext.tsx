import React, { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';
import { Claimable, ClaimResponse, SponsoredClaimable } from '@/resources/addys/claimables/types';
import { logger, RainbowError } from '@/logger';
import { getProvider } from '@/handlers/web3';
import { haptics } from '@/utils';
import { getAddysHttpClient } from '@/resources/addys/client';
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { ClaimStatus } from '../../shared/types';
import { analytics } from '@/analytics';
import { ADDYS_BASE_URL } from 'react-native-dotenv';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { useAccountAddress } from '@/state/wallets/walletsStore';

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
  const accountAddress = useAccountAddress();

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('ready');

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
          response = await getAddysHttpClient().get(path);
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('recoverableError');
          logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.CLAIM_API_CALL_FAILED}`));
          analytics.track(analytics.event.claimClaimableFailed, {
            claimableType: 'sponsored',
            claimableId: claimable.type,
            chainId: claimable.chainId,
            assets: claimable.assets.map(({ asset, amount }) => ({ symbol: asset.symbol, address: asset.address, amount: amount.amount })),
            isSwapping: false,
            outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            outputChainId: claimable.chainId,
            usdValue: claimable.totalCurrencyValue.amount,
            failureStep: 'claim',
            errorMessage: ErrorMessages.CLAIM_API_CALL_FAILED,
          });
          return;
        }
      } else {
        try {
          response = await getAddysHttpClient().post(path);
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('recoverableError');
          logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.CLAIM_API_CALL_FAILED}`));
          analytics.track(analytics.event.claimClaimableFailed, {
            claimableType: 'sponsored',
            claimableId: claimable.type,
            chainId: claimable.chainId,
            assets: claimable.assets.map(({ asset, amount }) => ({ symbol: asset.symbol, address: asset.address, amount: amount.amount })),
            isSwapping: false,
            outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            outputChainId: claimable.chainId,
            failureStep: 'claim',
            usdValue: claimable.totalCurrencyValue.amount,
            errorMessage: ErrorMessages.CLAIM_API_CALL_FAILED,
          });
          return;
        }
      }

      if (!response.data.payload.success) {
        haptics.notificationError();
        setClaimStatus('recoverableError');
        logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.CLAIM_API_UNSUCCESSFUL_RESPONSE}`));
        analytics.track(analytics.event.claimClaimableFailed, {
          claimableType: 'sponsored',
          claimableId: claimable.type,
          chainId: claimable.chainId,
          assets: claimable.assets.map(({ asset, amount }) => ({ symbol: asset.symbol, address: asset.address, amount: amount.amount })),
          isSwapping: false,
          outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          outputChainId: claimable.chainId,
          failureStep: 'claim',
          usdValue: claimable.totalCurrencyValue.amount,
          errorMessage: ErrorMessages.CLAIM_API_UNSUCCESSFUL_RESPONSE,
        });
      } else {
        haptics.notificationSuccess();

        if (response.data.payload.claim_transaction_status?.transaction_hash) {
          setClaimStatus('success');
        } else {
          setClaimStatus('pending');
        }

        analytics.track(analytics.event.claimClaimableSucceeded, {
          claimableType: 'sponsored',
          claimableId: claimable.type,
          chainId: claimable.chainId,
          assets: claimable.assets.map(({ asset, amount }) => ({ symbol: asset.symbol, address: asset.address, amount: amount.amount })),
          usdValue: claimable.totalCurrencyValue.amount,
          isSwapping: false,
          outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          outputChainId: claimable.chainId,
        });

        // Immediately remove the claimable from cached data
        useClaimablesStore.getState().markClaimed(claimable.uniqueId);
      }
    },
    onError: e => {
      haptics.notificationError();
      setClaimStatus('recoverableError');
      logger.error(new RainbowError(`[SponsoredClaimableContext]: ${ErrorMessages.UNHANDLED_ERROR}`), {
        message: (e as Error)?.message,
      });
      analytics.track(analytics.event.claimClaimableFailed, {
        claimableType: 'sponsored',
        claimableId: claimable.type,
        chainId: claimable.chainId,
        assets: claimable.assets.map(({ asset, amount }) => ({ symbol: asset.symbol, address: asset.address, amount: amount.amount })),
        usdValue: claimable.totalCurrencyValue.amount,
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
        analytics.track(analytics.event.claimClaimableFailed, {
          claimableType: 'sponsored',
          claimableId: claimable.type,
          chainId: claimable.chainId,
          assets: claimable.assets.map(({ asset, amount }) => ({ symbol: asset.symbol, address: asset.address, amount: amount.amount })),
          usdValue: claimable.totalCurrencyValue.amount,
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
      setTimeout(() => useClaimablesStore.getState().fetch(undefined, { staleTime: 0 }), 20_000);
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
