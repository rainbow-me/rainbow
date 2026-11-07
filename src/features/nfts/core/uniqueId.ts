import { isAddress, type Address } from 'viem';

import { type Network } from '@/features/network/types/backendNetworks';

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

export function isDataComplete(tokens: string[]) {
  if (!tokens.length) return true;

  for (const token of tokens) {
    const { network, contractAddress, tokenId } = parseUniqueId(token);
    if (!network || !contractAddress || !tokenId) return false;
  }
  return true;
}
