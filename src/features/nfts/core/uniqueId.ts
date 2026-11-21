import { isAddress, type Address } from 'viem';

import { type Network } from '@/features/network/types/backendNetworks';

/**
 * Returns the Arc collection prefix of a network-qualified NFT ID.
 */
export function collectionIdFromUniqueId(uniqueId: string): string {
  return uniqueId.slice(0, uniqueId.lastIndexOf('_')).toLowerCase();
}

/**
 * Reads a network-qualified NFT ID or a legacy contract and token ID.
 */
export function parseUniqueId(uniqueId: string): {
  network?: Network;
  contractAddress: Address;
  tokenId: string;
} {
  const parts = uniqueId.split('_');
  if (parts.length === 2 && isAddress(parts[0])) {
    const [contractAddress, tokenId] = parts;
    return {
      contractAddress: contractAddress as Address,
      tokenId,
    };
  }
  const [network, contractAddress, tokenId] = parts;
  return {
    network: network as Network,
    contractAddress: contractAddress as Address,
    tokenId,
  };
}

/**
 * Whether every saved ID includes its network, contract and token.
 */
export function areTokenIdsNetworkQualified(tokens: readonly string[]): boolean {
  for (const token of tokens) {
    const { network, contractAddress, tokenId } = parseUniqueId(token);
    if (!network || !contractAddress || !tokenId) return false;
  }
  return true;
}
