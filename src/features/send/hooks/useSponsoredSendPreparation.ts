import { useEffect, useMemo, useState } from 'react';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { isAddress } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { isPreparedCallsExecutionSponsored } from '@/features/delegation/calls';
import { predictSponsoredSend, prepareSponsoredSend } from '@/features/delegation/sponsoredSend';
import { buildSendCallFromSendDetails } from '@/features/delegation/sponsoredSendExecution';
import { parsePositiveRawAmount } from '@/framework/core/evm/units';
import { ensureError, logger } from '@/logger';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { type Call, type PreparedCallsExecution } from '@rainbow-me/delegation';

type PreparedSponsoredSendState =
  | { call: Call; key: string; preparedCalls: PreparedCallsExecution }
  | { call: null; key: string; preparedCalls: null };

type UseSponsoredSendPreparationParams = {
  accountAddress: string | undefined;
  amount: string;
  chainId: ChainId;
  debouncedAmount: string;
  isENS: boolean;
  isSufficientBalance: boolean;
  isValidAddress: boolean;
  provider: StaticJsonRpcProvider | undefined;
  selected: ParsedAddressAsset | undefined;
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
  selected: Pick<ParsedAddressAsset, 'address' | 'decimals' | 'uniqueId'>;
  toAddress: string;
}): string | null {
  const rawAmount = parsePositiveRawAmount(amount, selected.decimals);
  if (rawAmount === null) return null;

  return [getSponsoredSendContextKey({ accountAddress, chainId, selected, toAddress }), rawAmount.toString()].join(':');
}

function getSponsoredSendContextKey({
  accountAddress,
  chainId,
  selected,
  toAddress,
}: {
  accountAddress: string;
  chainId: ChainId;
  selected: Pick<ParsedAddressAsset, 'address' | 'decimals' | 'uniqueId'>;
  toAddress: string;
}): string {
  return [
    accountAddress.toLowerCase(),
    chainId,
    selected.uniqueId,
    selected.address.toLowerCase(),
    selected.decimals,
    toAddress.toLowerCase(),
  ].join(':');
}

export function useSponsoredSendPreparation({
  accountAddress,
  amount,
  chainId,
  debouncedAmount,
  isENS,
  isSufficientBalance,
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

  const sponsoredSendContextKey =
    accountAddress && selected && toAddress
      ? getSponsoredSendContextKey({
          accountAddress,
          chainId,
          selected,
          toAddress,
        })
      : null;

  const sponsoredSendRequestKey =
    accountAddress && selected && toAddress
      ? getSponsoredSendRequestKey({
          accountAddress,
          amount,
          chainId,
          selected,
          toAddress,
        })
      : null;

  const debouncedSponsoredSendRequestKey =
    accountAddress && selected && toAddress
      ? getSponsoredSendRequestKey({
          accountAddress,
          amount: debouncedAmount,
          chainId,
          selected,
          toAddress,
        })
      : null;

  const [preparedSponsoredSend, setPreparedSponsoredSend] = useState<PreparedSponsoredSendState | null>(null);
  const [isPreparingSponsoredSend, setIsPreparingSponsoredSend] = useState(false);
  const hasResolvedSponsoredSend = preparedSponsoredSend?.key === sponsoredSendRequestKey;
  const preparedCalls = hasResolvedSponsoredSend ? preparedSponsoredSend.preparedCalls : null;
  const isSponsoredSend = isPreparedCallsExecutionSponsored(preparedCalls);
  const preparedCall = hasResolvedSponsoredSend && isSponsoredSend ? preparedSponsoredSend.call : null;
  const shouldShowSponsoredSendGas =
    canUseSponsoredSend &&
    isSufficientBalance &&
    (!sponsoredSendRequestKey || isPreparingSponsoredSend || debouncedAmount !== amount || !hasResolvedSponsoredSend || isSponsoredSend);

  useEffect(() => {
    let isStale = false;
    const abortController = new AbortController();

    const prepareSend = async () => {
      if (
        !canUseSponsoredSend ||
        !accountAddress ||
        !isAddress(accountAddress) ||
        !selected ||
        !provider ||
        !isSufficientBalance ||
        !sponsoredSendContextKey ||
        !debouncedSponsoredSendRequestKey
      ) {
        setPreparedSponsoredSend(null);
        setIsPreparingSponsoredSend(false);
        return;
      }

      setPreparedSponsoredSend(null);
      setIsPreparingSponsoredSend(true);

      try {
        const call = await buildSendCallFromSendDetails({
          amount: debouncedAmount,
          asset: selected,
          chainId,
          toAddress,
        });
        if (abortController.signal.aborted) return;

        const nextPreparedCalls = await prepareSponsoredSend({
          accountAddress,
          call,
          chainId,
          signal: abortController.signal,
        });

        if (!isStale) {
          if (nextPreparedCalls) {
            setPreparedSponsoredSend({ call, key: debouncedSponsoredSendRequestKey, preparedCalls: nextPreparedCalls });
          } else {
            setPreparedSponsoredSend({ call: null, key: debouncedSponsoredSendRequestKey, preparedCalls: null });
          }
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        const message = ensureError(error).message;
        logger.warn('[useSponsoredSendPreparation]: sponsored send preparation failed', { message });
        if (!isStale) {
          setPreparedSponsoredSend({ call: null, key: debouncedSponsoredSendRequestKey, preparedCalls: null });
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
      abortController.abort();
    };
  }, [
    accountAddress,
    canUseSponsoredSend,
    chainId,
    debouncedAmount,
    debouncedSponsoredSendRequestKey,
    isSufficientBalance,
    provider,
    selected,
    sponsoredSendContextKey,
    toAddress,
  ]);

  return {
    canUseSponsoredSend,
    hasResolvedSponsoredSend,
    isPreparingSponsoredSend,
    isSponsoredSend,
    preparedCall,
    preparedCalls,
    shouldShowSponsoredSendGas,
  };
}
