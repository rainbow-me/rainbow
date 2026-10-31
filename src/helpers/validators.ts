import { isValidAddress } from 'ethereumjs-util';

import { isUnstoppableAddressFormat } from '@/features/address/core/domainFormat';
import { normalizeEnsName } from '@/features/ens/core/name';
import { ChainId } from '@/features/network/types/backendNetworks';
import { isHexStringIgnorePrefix, isValidMnemonic, resolveNameOrAddress } from '@/handlers/web3';
import { sanitizeSeedPhrase } from '@/utils/formatters';

/**
 * Checks address or name syntax without requiring a record on a particular chain.
 */
export function checkIsValidAddressOrDomainFormat(input: string | null | undefined): boolean {
  if (!input) return false;
  const value = input.trim();
  if (isValidAddress(value)) return true;
  if (value.startsWith('0x') || !value.includes('.')) return false;
  if (isUnstoppableAddressFormat(value)) return true;
  try {
    normalizeEnsName(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks whether an address or name has an Ethereum destination for chain-agnostic legacy callers.
 */
export async function checkIsValidAddressOrDomain(input: string | null | undefined): Promise<boolean> {
  if (!input || !checkIsValidAddressOrDomainFormat(input)) return false;
  try {
    return (await resolveNameOrAddress(input, ChainId.mainnet)) !== null;
  } catch {
    return false;
  }
}

/**
 * Validates the input required to create a new wallet.
 */
export function isValidWallet(input: string): boolean {
  return Boolean(input) && (isValidPrivateKey(input) || isValidSeedPhrase(input) || checkIsValidAddressOrDomainFormat(input));
}

/**
 * Validates a seed phrase mnemonic.
 */
function isValidSeedPhrase(mnemonic: string): boolean {
  const sanitizedSeedPhrase = sanitizeSeedPhrase(mnemonic);
  return sanitizedSeedPhrase.split(' ').length >= 12 && isValidMnemonic(sanitizedSeedPhrase);
}

/**
 * Validates a private key string.
 */
function isValidPrivateKey(key: string): boolean {
  return key.length >= 64 && isHexStringIgnorePrefix(key);
}
