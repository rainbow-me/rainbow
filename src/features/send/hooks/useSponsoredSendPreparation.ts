import { useEffect, useMemo, useRef, useState } from 'react';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { parseUnits } from '@ethersproject/units';
import { isAddress, type Address } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { isPreparedCallsExecutionSponsored } from '@/features/delegation/calls';
import { predictSponsoredSend, prepareSponsoredSend } from '@/features/delegation/sponsoredSend';
import { buildSendCallFromSendDetails } from '@/features/delegation/sponsoredSendExecution';
import { supportsDelegatedExecution } from '@/features/delegation/willDelegate';
import { ensureError, logger } from '@/logger';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { type PreparedCallsExecution } from '@rainbow-me/delegation';

type PreparedSponsoredSendState = {
  key: string;
  preparedCalls: PreparedCallsExecution | null;
};

type DelegationSupportCache = Map<string, Promise<boolean>>;
type DelegationSupportLoader = (params: { address: Address; chainId: ChainId }) => Promise<boolean>;

type UseSponsoredSendPreparationParams = {
  accountAddress: string | undefined;
  amount: string;
  chainId: ChainId;
  debouncedAmount: string;
  isENS: boolean;
  isValidAddress: boolean;
  provider: StaticJsonRpcProvider | undefined;
  selected: ParsedAddressAsset | undefined;
  toAddress: string;
};

export function getDelegationSupportRequestKey({ accountAddress, chainId }: { accountAddress: Address; chainId: ChainId }): string {
  return [accountAddress.toLowerCase(), chainId].join(':');
}

export function getCachedDelegationSupport({
  accountAddress,
  cache,
  chainId,
  loadSupport = supportsDelegatedExecution,
}: {
  accountAddress: Address;
  cache: DelegationSupportCache;
  chainId: ChainId;
  loadSupport?: DelegationSupportLoader;
}): Promise<boolean> {
  const cacheKey = getDelegationSupportRequestKey({ accountAddress, chainId });
  const cachedSupport = cache.get(cacheKey);
  if (cachedSupport) return cachedSupport;

  const supportRequest = loadSupport({ address: accountAddress, chainId }).catch(error => {
    cache.delete(cacheKey);
    throw error;
  });
  cache.set(cacheKey, supportRequest);
  return supportRequest;
}

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
  let rawAmount: bigint;
  try {
    rawAmount = BigInt(parseUnits(amount, selected.decimals).toString());
  } catch {
    return null;
  }
  if (rawAmount <= 0n) return null;

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
  isValidAddress,
  provider,
  selected,
  toAddress,
}: UseSponsoredSendPreparationParams) {
  const sponsorshipEligibleChainIds = useBackendNetworksStore(state => state.getSponsorshipEligibleChainIds());
  const { sponsored_sends_enabled: sponsoredSendsEnabled } = useRemoteConfig('sponsored_sends_enabled');
  const delegationSupportCacheRef = useRef<DelegationSupportCache>(new Map());

  const canUseSponsoredSend = useMemo(() => {
    if (!sponsoredSendsEnabled || !accountAddress || !provider || !selected || isENS || !isValidAddress || !toAddress) return false;

    return predictSponsoredSend({
      address: accountAddress,
      chainId,
      sponsorshipEligibleChainIds,
    });
  }, [accountAddress, chainId, isENS, isValidAddress, provider, selected, sponsoredSendsEnabled, sponsorshipEligibleChainIds, toAddress]);

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
  const shouldShowSponsoredSendGas =
    canUseSponsoredSend &&
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
          accountAddress,
          amount: debouncedAmount,
          asset: selected,
          chainId,
          provider,
          toAddress,
        });
        if (abortController.signal.aborted) return;

        const delegationSupported = await getCachedDelegationSupport({
          accountAddress,
          cache: delegationSupportCacheRef.current,
          chainId,
        });
        if (abortController.signal.aborted) return;

        const nextPreparedCalls = await prepareSponsoredSend({
          accountAddress,
          call,
          chainId,
          delegationSupported,
          signal: abortController.signal,
        });

        if (!isStale) {
          setPreparedSponsoredSend({ key: debouncedSponsoredSendRequestKey, preparedCalls: nextPreparedCalls });
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
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
      abortController.abort();
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
