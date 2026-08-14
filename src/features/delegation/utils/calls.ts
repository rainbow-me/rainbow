import { createPublicClient, http, type PublicClient } from 'viem';

import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { RainbowError } from '@/logger';
import { type CallsPolicy, type PreparedCallsExecution } from '@rainbow-me/sdk';

/**
 * SDK policy for relay-sponsored atomic execution.
 */
export const SPONSORED_CALLS_POLICY = {
  atomic: true,
  sponsorship: 'required',
} satisfies CallsPolicy;

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
 * Identifies sponsor-paid managed preparations.
 */
export function isPreparedCallsExecutionSponsored(
  prepared: PreparedCallsExecution | null
): prepared is PreparedCallsExecution<'calls.managed'> {
  return prepared?.kind === 'calls.managed' && prepared.review.fees.payer === 'sponsor';
}
