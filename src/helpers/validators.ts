import { isValidAddress } from 'ethereumjs-util';
import { normalize } from 'viem/ens';

import { isUnstoppableAddressFormat } from '@/features/address/core/domainFormat';
import { ChainId } from '@/features/network/types/backendNetworks';
import { isHexStringIgnorePrefix, isValidMnemonic, resolveNameOrAddress } from '@/handlers/web3';
import { sanitizeSeedPhrase } from '@/utils/formatters';

/**
 * @desc validate email
 * @param  {String}  email
 * @return {Boolean}
 */
export const isValidEmail = (email: any) =>
  !!email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );

/** Checks address or name syntax without requiring a record on a particular chain. */
export function checkIsValidAddressOrDomainFormat(input: string | null | undefined): boolean {
  if (!input) return false;
  const value = input.trim();
  if (isValidAddress(value)) return true;
  if (value.startsWith('0x') || !value.includes('.')) return false;
  if (isUnstoppableAddressFormat(value)) return true;
  try {
    normalize(value);
    return true;
  } catch {
    return false;
  }
}

/** Checks whether an address or name has an Ethereum destination for chain-agnostic legacy callers. */
export async function checkIsValidAddressOrDomain(input: string | null | undefined): Promise<boolean> {
  if (!input || !checkIsValidAddressOrDomainFormat(input)) return false;
  try {
    return (await resolveNameOrAddress(input, ChainId.mainnet)) !== null;
  } catch {
    return false;
  }
}

/**
 * @desc validate seed phrase mnemonic
 * @param  {String} seed phrase mnemonic
 * @return {Boolean}
 */
const isValidSeedPhrase = (seedPhrase: any) => {
  const sanitizedSeedPhrase = sanitizeSeedPhrase(seedPhrase);
  return sanitizedSeedPhrase.split(' ').length >= 12 && isValidMnemonic(sanitizedSeedPhrase);
};

/**
 * @desc validate private key string
 * @param  {String} private key string
 * @return {Boolean}
 */
const isValidPrivateKey = (key: any) => {
  return key.length >= 64 && isHexStringIgnorePrefix(key);
};

/**
 * @desc validate seed phrase mnemonic or private key
 * @param  {String} seed phrase mnemonic or private key
 * @return {Boolean}
 */
export const isValidSeed = (seed: any) => seed && (isValidPrivateKey(seed) || isValidSeedPhrase(seed));

/**
 * @desc validates the input required to create a new wallet
 * @param  {String} seed, mnemonic, private key, address, ENS name, or Unstoppable name
 * @return {Boolean}
 */
export const isValidWallet = (seed: any) =>
  seed && (isValidPrivateKey(seed) || isValidSeedPhrase(seed) || checkIsValidAddressOrDomainFormat(seed));
