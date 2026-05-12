import { useEffect, useMemo, useState } from 'react';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { isAddress } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { buildTransaction } from '@/handlers/web3';
import { logger } from '@/logger';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { type PreparedCallsExecution } from '@rainbow-me/delegation';

import { buildSendCall, isPreparedSponsoredSend, predictSponsoredSend, prepareSponsoredSend } from '../../sponsoredSend';

type UseSponsoredSendPreparationParams = {
  accountAddress: string | undefined;
  amount: string;
  chainId: ChainId;
  isENS: boolean;
  isNativeSponsoredSendCandidate: boolean;
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
  isENS,
  isNativeSponsoredSendCandidate,
  isValidAddress,
  provider,
  selected,
  toAddress,
}: UseSponsoredSendPreparationParams) {
  const sponsorshipEligibleChainIds = useBackendNetworksStore(state => state.getSponsorshipEligibleChainIds());
  const { sponsored_sends_enabled: sponsoredSendsEnabled } = useRemoteConfig('sponsored_sends_enabled');

  const canUseSponsoredSend = useMemo(() => {
    if (
      !sponsoredSendsEnabled ||
      !accountAddress ||
      !provider ||
      !selected ||
      isENS ||
      !isNativeSponsoredSendCandidate ||
      !isValidAddress ||
      !toAddress ||
      Number(amount) <= 0
    )
      return false;

    return predictSponsoredSend({
      address: accountAddress,
      chainId,
      sponsorshipEligibleChainIds,
    });
  }, [
    accountAddress,
    amount,
    chainId,
    isENS,
    isNativeSponsoredSendCandidate,
    isValidAddress,
    provider,
    selected,
    sponsoredSendsEnabled,
    sponsorshipEligibleChainIds,
    toAddress,
  ]);

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

  const [preparedCalls, setPreparedCalls] = useState<PreparedCallsExecution | null>(null);
  const [isPreparingSponsoredSend, setIsPreparingSponsoredSend] = useState(false);
  const isSponsoredSend = isPreparedSponsoredSend(preparedCalls);

  useEffect(() => {
    let isStale = false;

    const prepareSend = async () => {
      if (!canUseSponsoredSend || !accountAddress || !isAddress(accountAddress) || !selected || !provider || !sponsoredSendRequestKey) {
        setPreparedCalls(null);
        setIsPreparingSponsoredSend(false);
        return;
      }

      setPreparedCalls(null);
      setIsPreparingSponsoredSend(true);

      try {
        const transaction = await buildTransaction(
          {
            address: accountAddress,
            amount: Number(amount),
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
          setPreparedCalls(nextPreparedCalls);
        }
      } catch (error) {
        logger.warn('[useSponsoredSendPreparation]: sponsored send preparation failed', { error });
        if (!isStale) {
          setPreparedCalls(null);
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
  }, [accountAddress, amount, canUseSponsoredSend, chainId, provider, selected, sponsoredSendRequestKey, toAddress]);

  return {
    canUseSponsoredSend,
    isPreparingSponsoredSend,
    isSponsoredSend,
    preparedCalls,
  };
}
