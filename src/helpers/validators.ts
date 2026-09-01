import { isValidAddress } from 'ethereumjs-util';

import { isENSAddressFormat, isUnstoppableAddressFormat } from '@/features/address/core/domainFormat';
import { ChainId } from '@/features/network/types/backendNetworks';
import { getProvider, isHexStringIgnorePrefix, isValidMnemonic, resolveUnstoppableDomain } from '@/handlers/web3';
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

/**
 * @desc validate ethereum address, ENS, or Unstoppable name formatting
 * @param  {String} address, ENS, or Unstoppable
 * @return {Boolean}
 */
export const checkIsValidAddressOrDomainFormat = (address: any) => {
  if (isENSAddressFormat(address)) {
    return true;
  }
  if (isUnstoppableAddressFormat(address)) {
    return true;
  }
  return isValidAddress(address);
};

/**
 * @desc validate ethereum address, ENS, or Unstoppable name
 * @param  {String} address, ENS, or Unstoppable
 * @return {Boolean}
 */
export const checkIsValidAddressOrDomain = async (address: any) => {
  const provider = getProvider({ chainId: ChainId.mainnet });
  if (isENSAddressFormat(address)) {
    try {
      const resolvedAddress = await provider.resolveName(address);
      return !!resolvedAddress;
    } catch (error) {
      return false;
    }
  }
  if (isUnstoppableAddressFormat(address)) {
    const resolvedAddress = await resolveUnstoppableDomain(address);
    return !!resolvedAddress;
  }
  return isValidAddress(address);
};

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
  seed &&
  (isValidPrivateKey(seed) ||
    isValidSeedPhrase(seed) ||
    isValidAddress(seed) ||
    isUnstoppableAddressFormat(seed) ||
    isENSAddressFormat(seed));
