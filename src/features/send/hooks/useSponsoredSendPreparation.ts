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
  | { accountAddress: string; call: Call; chainId: ChainId; key: string; preparedCalls: PreparedCallsExecution }
  | { accountAddress: string; call: null; chainId: ChainId; key: string; preparedCalls: null };

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

type SponsoredSendRequest = {
  accountAddress: string;
  chainId: ChainId;
  selected: Pick<ParsedAddressAsset, 'address' | 'decimals' | 'uniqueId'>;
  toAddress: string;
};

export function getSponsoredSendRequestKey(
  { accountAddress, chainId, selected, toAddress }: SponsoredSendRequest,
  amount: string
): string | null {
  const rawAmount = parsePositiveRawAmount(amount, selected.decimals);
  if (rawAmount === null) return null;

  return [
    accountAddress.toLowerCase(),
    chainId,
    selected.uniqueId,
    selected.address.toLowerCase(),
    selected.decimals,
    toAddress.toLowerCase(),
    rawAmount.toString(),
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
    if (!sponsoredSendsEnabled || !accountAddress || !provider || !selected || isENS || !isValidAddress) return false;

    return predictSponsoredSend({
      address: accountAddress,
      chainId,
      sponsorshipEligibleChainIds,
    });
  }, [accountAddress, chainId, isENS, isValidAddress, provider, selected, sponsoredSendsEnabled, sponsorshipEligibleChainIds]);

  const sponsoredSendRequest = useMemo(
    () => (accountAddress && selected && toAddress ? { accountAddress, chainId, selected, toAddress } : null),
    [accountAddress, chainId, selected, toAddress]
  );

  const currentSponsoredSendKey = useMemo(
    () => (sponsoredSendRequest ? getSponsoredSendRequestKey(sponsoredSendRequest, amount) : null),
    [amount, sponsoredSendRequest]
  );

  const debouncedSponsoredSendKey = useMemo(
    () => (sponsoredSendRequest ? getSponsoredSendRequestKey(sponsoredSendRequest, debouncedAmount) : null),
    [debouncedAmount, sponsoredSendRequest]
  );

  const [preparedSponsoredSend, setPreparedSponsoredSend] = useState<PreparedSponsoredSendState | null>(null);
  const [isPreparingSponsoredSend, setIsPreparingSponsoredSend] = useState(false);

  const hasResolvedSponsoredSend = preparedSponsoredSend?.key === currentSponsoredSendKey;
  const preparedCalls = hasResolvedSponsoredSend ? preparedSponsoredSend.preparedCalls : null;
  const isSponsoredSend = isPreparedCallsExecutionSponsored(preparedCalls);
  const preparedCall = hasResolvedSponsoredSend && isSponsoredSend ? preparedSponsoredSend.call : null;

  const sponsorshipUnavailableForCurrentChain =
    preparedSponsoredSend?.accountAddress.toLowerCase() === accountAddress?.toLowerCase() &&
    preparedSponsoredSend?.chainId === chainId &&
    !isPreparedCallsExecutionSponsored(preparedSponsoredSend.preparedCalls);

  const shouldShowSponsoredSendGas =
    canUseSponsoredSend &&
    !sponsorshipUnavailableForCurrentChain &&
    (!currentSponsoredSendKey || isPreparingSponsoredSend || !hasResolvedSponsoredSend || isSponsoredSend);

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
        !debouncedSponsoredSendKey
      ) {
        setIsPreparingSponsoredSend(false);
        return;
      }

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
          setPreparedSponsoredSend(
            nextPreparedCalls
              ? { accountAddress, call, chainId, key: debouncedSponsoredSendKey, preparedCalls: nextPreparedCalls }
              : { accountAddress, call: null, chainId, key: debouncedSponsoredSendKey, preparedCalls: null }
          );
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        const message = ensureError(error).message;
        logger.warn('[useSponsoredSendPreparation]: sponsored send preparation failed', { message });
        if (!isStale) {
          setPreparedSponsoredSend({ accountAddress, call: null, chainId, key: debouncedSponsoredSendKey, preparedCalls: null });
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
    debouncedSponsoredSendKey,
    isSufficientBalance,
    provider,
    selected,
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
