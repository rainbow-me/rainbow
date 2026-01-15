import type { Address } from 'viem';
import { AddressOrEth } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';

import { RouteConfig, WithdrawalTokenData } from '../types';

// ============ Types ========================================================== //

export type WithdrawalSwapKind = 'crossChain' | 'none' | 'sameChain';

export type WithdrawalSwapRequirement = {
  kind: WithdrawalSwapKind;
  requiresQuote: boolean;
};

type DetermineSwapKindParams = {
  buyTokenAddress: AddressOrEth | null;
  route: RouteConfig;
  targetChainId: ChainId | undefined;
};

// ============ Constants ====================================================== //

const SWAP_REQUIREMENTS: Record<WithdrawalSwapKind, WithdrawalSwapRequirement> = {
  crossChain: { kind: 'crossChain', requiresQuote: true },
  none: { kind: 'none', requiresQuote: false },
  sameChain: { kind: 'sameChain', requiresQuote: true },
};

// ============ Helpers ======================================================== //

function isSameAddress(a: AddressOrEth, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Resolves the token address for a specific chain from token network data.
 */
export function resolveTokenAddressForChain(tokenData: WithdrawalTokenData | null, chainId: ChainId | undefined): AddressOrEth | null {
  if (!tokenData || !chainId) return null;
  return tokenData.networks[String(chainId)]?.address ?? null;
}

function determineSwapKind({ buyTokenAddress, route, targetChainId }: DetermineSwapKindParams): WithdrawalSwapKind {
  if (!targetChainId) return 'none';

  const isCrossChain = targetChainId !== route.from.chainId;
  if (isCrossChain) return 'crossChain';

  if (!route.to.enableSameChainSwap) return 'none';

  const swappingToSameToken = buyTokenAddress && isSameAddress(route.from.token.address, buyTokenAddress);
  return swappingToSameToken ? 'none' : 'sameChain';
}

// ============ Determination ================================================== //

export function getWithdrawalSwapRequirement(params: DetermineSwapKindParams): WithdrawalSwapRequirement {
  return SWAP_REQUIREMENTS[determineSwapKind(params)];
}
