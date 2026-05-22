import { createPublicClient, http, type PublicClient } from 'viem';

import { RainbowError } from '@/logger';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { type CallsRequirements, type PreparedCallsExecution } from '@rainbow-me/delegation';

/**
 * SDK exact-call requirements for relay-sponsored atomic execution.
 */
export const SPONSORED_CALLS_REQUIREMENTS = {
  atomic: 'required',
  fees: { payer: 'sponsor' },
} satisfies CallsRequirements;

/**
 * Creates a viem public client for a Rainbow-supported chain.
 */
export function createDelegationPublicClient(chainId: ChainId, options?: { signal?: AbortSignal }): PublicClient {
  const chain = backendNetworksActions.getDefaultChains()[chainId];
  if (!chain) {
    throw new RainbowError(`[createDelegationPublicClient]: Unsupported chain ${chainId}`);
  }

  const rpcUrl = backendNetworksActions.getChainDefaultRpc(chainId);

  return createPublicClient({
    chain,
    transport: http(rpcUrl, options?.signal ? { fetchOptions: { signal: options.signal } } : undefined),
  });
}

/**
 * Returns true when a prepared exact-call execution is sponsor-paid.
 */
export function isPreparedCallsExecutionSponsored(prepared: PreparedCallsExecution | null): boolean {
  return prepared?.kind === 'calls.managed' && prepared.review.fees.payer === 'sponsor';
}
