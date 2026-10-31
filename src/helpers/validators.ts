import { isValidAddressOrDomainFormat } from '@/features/address/core/address';
import { isHexStringIgnorePrefix, isValidMnemonic } from '@/handlers/web3';
import { sanitizeSeedPhrase } from '@/utils/formatters';

/**
 * Validates the input required to create a new wallet.
 */
export function isValidWallet(input: string): boolean {
  return Boolean(input) && (isValidPrivateKey(input) || isValidSeedPhrase(input) || isValidAddressOrDomainFormat(input));
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
