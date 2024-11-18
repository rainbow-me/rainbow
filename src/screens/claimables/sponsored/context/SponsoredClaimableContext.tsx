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
          logger.error(new RainbowError('[SponsoredClaimableContext]: failed to execute sponsored claim api call'));
          return;
        }
      } else {
        try {
          response = await addysHttp.post(path);
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('recoverableError');
          logger.error(new RainbowError('[SponsoredClaimableContext]: failed to execute sponsored claim api call'));
          return;
        }
      }

      if (!response.data.payload.success) {
        haptics.notificationError();
        setClaimStatus('recoverableError');
        logger.error(new RainbowError('[SponsoredClaimableContext]: sponsored claim api call returned unsuccessful response'));
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
      setClaimStatus('recoverableError');
      logger.error(new RainbowError('[SponsoredClaimableContext]: Failed to claim claimable due to unhandled error'), {
        message: (e as Error)?.message,
      });
    },
    onSuccess: () => {
      if (claimStatus === 'claiming') {
        haptics.notificationError();
        setClaimStatus('recoverableError');
        logger.error(
          new RainbowError('[SponsoredClaimableContext]: claim function completed but never resolved status to success or error state')
        );
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
