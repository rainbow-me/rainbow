import { useEffect, useMemo, useState } from 'react';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { isAddress } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { buildTransaction } from '@/handlers/web3';
import { ensureError, logger } from '@/logger';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { type PreparedCallsExecution } from '@rainbow-me/delegation';

import { buildSendCall, isPreparedSponsoredSend, predictSponsoredSend, prepareSponsoredSend } from '../../sponsoredSend';

type PreparedSponsoredSendState = {
  key: string;
  preparedCalls: PreparedCallsExecution | null;
};

type UseSponsoredSendPreparationParams = {
  accountAddress: string | undefined;
  amount: string;
  chainId: ChainId;
  debouncedAmount: string;
  isENS: boolean;
  isValidAddress: boolean;
  provider: StaticJsonRpcProvider | undefined;
  selected: ParsedAddressAsset | UniqueAsset | undefined;
  toAddress: string;
};

export function getSponsoredSendRequestKey({
  accountAddress,
  amount,
  chainId,
  selected,
  toAddress,
}: {
  accountAddress: string;
  amount: string;
  chainId: ChainId;
  selected: ParsedAddressAsset | UniqueAsset;
  toAddress: string;
}): string | null {
  if (Number(amount) <= 0) return null;

  return [accountAddress.toLowerCase(), chainId, selected.uniqueId, toAddress.toLowerCase(), amount].join(':');
}

export function useSponsoredSendPreparation({
  accountAddress,
  amount,
  chainId,
  debouncedAmount,
  isENS,
  isValidAddress,
  provider,
  selected,
  toAddress,
}: UseSponsoredSendPreparationParams) {
  const sponsorshipEligibleChainIds = useBackendNetworksStore(state => state.getSponsorshipEligibleChainIds());
  const { sponsored_sends_enabled: sponsoredSendsEnabled } = useRemoteConfig('sponsored_sends_enabled');

  const canUseSponsoredSend = useMemo(() => {
    if (!sponsoredSendsEnabled || !accountAddress || !provider || !selected || isENS || !isValidAddress || !toAddress) return false;

    return predictSponsoredSend({
      address: accountAddress,
      chainId,
      sponsorshipEligibleChainIds,
    });
  }, [accountAddress, chainId, isENS, isValidAddress, provider, selected, sponsoredSendsEnabled, sponsorshipEligibleChainIds, toAddress]);

  const sponsoredSendRequestKey = useMemo(() => {
    if (!accountAddress || !selected || !toAddress) return null;

    return getSponsoredSendRequestKey({
      accountAddress,
      amount,
      chainId,
      selected,
      toAddress,
    });
  }, [accountAddress, amount, chainId, selected, toAddress]);

  const debouncedSponsoredSendRequestKey = useMemo(() => {
    if (!accountAddress || !selected || !toAddress) return null;

    return getSponsoredSendRequestKey({
      accountAddress,
      amount: debouncedAmount,
      chainId,
      selected,
      toAddress,
    });
  }, [accountAddress, chainId, debouncedAmount, selected, toAddress]);

  const [preparedSponsoredSend, setPreparedSponsoredSend] = useState<PreparedSponsoredSendState | null>(null);
  const [isPreparingSponsoredSend, setIsPreparingSponsoredSend] = useState(false);
  const hasResolvedSponsoredSend = preparedSponsoredSend?.key === sponsoredSendRequestKey;
  const preparedCalls = hasResolvedSponsoredSend ? preparedSponsoredSend.preparedCalls : null;
  const isSponsoredSend = isPreparedSponsoredSend(preparedCalls);
  const shouldShowSponsoredSendGas =
    canUseSponsoredSend &&
    (!sponsoredSendRequestKey || isPreparingSponsoredSend || debouncedAmount !== amount || !hasResolvedSponsoredSend || isSponsoredSend);

  useEffect(() => {
    let isStale = false;

    const prepareSend = async () => {
      if (
        !canUseSponsoredSend ||
        !accountAddress ||
        !isAddress(accountAddress) ||
        !selected ||
        !provider ||
        !debouncedSponsoredSendRequestKey
      ) {
        setPreparedSponsoredSend(null);
        setIsPreparingSponsoredSend(false);
        return;
      }

      setPreparedSponsoredSend(null);
      setIsPreparingSponsoredSend(true);

      try {
        const transaction = await buildTransaction(
          {
            address: accountAddress,
            amount: Number(debouncedAmount),
            asset: selected,
            recipient: toAddress,
          },
          provider,
          chainId
        );
        const call = buildSendCall(transaction);
        const nextPreparedCalls = await prepareSponsoredSend({
          account: accountAddress,
          call,
          chainId,
        });

        if (!isStale) {
          setPreparedSponsoredSend({ key: debouncedSponsoredSendRequestKey, preparedCalls: nextPreparedCalls });
        }
      } catch (error) {
        const message = ensureError(error).message;
        logger.warn('[useSponsoredSendPreparation]: sponsored send preparation failed', { message });
        if (!isStale) {
          setPreparedSponsoredSend({ key: debouncedSponsoredSendRequestKey, preparedCalls: null });
        }
      } finally {
        if (!isStale) {
          setIsPreparingSponsoredSend(false);
        }
      }
    };

    prepareSend();

    return () => {
      isStale = true;
    };
  }, [accountAddress, canUseSponsoredSend, chainId, debouncedAmount, debouncedSponsoredSendRequestKey, provider, selected, toAddress]);

  return {
    canUseSponsoredSend,
    hasResolvedSponsoredSend,
    isPreparingSponsoredSend,
    isSponsoredSend,
    preparedCalls,
    shouldShowSponsoredSendGas,
  };
}
