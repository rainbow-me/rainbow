import Resolution from '@unstoppabledomains/resolution';
import { getAddress, type Address } from 'viem';

import { resolveEnsAddress } from '@/features/ens/data/ens';
import { ChainId } from '@/features/network/types/backendNetworks';
import { logger, RainbowError } from '@/logger';

import { getNameService, isValidAddress } from '../core/address';

/**
 * Resolves an address or supported name on the destination chain. Raw addresses
 * require no network request. ENS failures reject; a missing address returns null.
 * Unstoppable names retain their Ethereum address on every destination chain.
 */
export async function resolveNameOrAddress(nameOrAddress: string, chainId: ChainId, signal?: AbortSignal): Promise<Address | null> {
  const input = nameOrAddress.trim();
  if (isValidAddress(input)) return getAddress(input);

  switch (getNameService(input)) {
    case 'ens':
      return resolveEnsAddress(input, chainId, signal);
    case 'unstoppable': {
      const address = await resolveUnstoppableDomain(input);
      return address === null ? null : getAddress(address);
    }
    default:
      return null;
  }
}

/**
 * Checks for an Ethereum destination for chain-agnostic legacy callers, treating lookup failures as invalid input.
 */
export async function isValidAddressOrDomain(input: string | null | undefined): Promise<boolean> {
  if (!input) return false;

  try {
    return (await resolveNameOrAddress(input, ChainId.mainnet)) !== null;
  } catch {
    return false;
  }
}

async function resolveUnstoppableDomain(domain: string): Promise<string | null> {
  return new Resolution().addr(domain, 'ETH').catch(error => {
    logger.error(new RainbowError('[resolveAddress]: resolveUnstoppableDomain error'), { message: error.message });
    return null;
  });
}
