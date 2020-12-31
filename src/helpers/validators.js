import { isValidAddress } from 'ethereumjs-util';
import {
  isHexStringIgnorePrefix,
  isValidMnemonic,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import { sanitizeSeedPhrase } from '@rainbow-me/utils';

// Currently supported Top Level Domains from ENS
const supportedTLDs = ['eth', 'test', 'xyz', 'luxe', 'kred', 'club', 'art'];

/**
 * @desc validate email
 * @param  {String}  email
 * @return {Boolean}
 */
export const isValidEmail = email =>
  !!email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );

export const isENSAddressFormat = address => {
  const parts = address && address.split('.');
  if (
    !parts ||
    parts.length === 1 ||
    !supportedTLDs.includes(parts[parts.length - 1])
  ) {
    return false;
  }
  return true;
};

/**
 * @desc validate ethereum address or ENS name
 * @param  {String} address or ENS
 * @return {Boolean}
 */
export const checkIsValidAddressOrENS = async address => {
  if (isENSAddressFormat(address)) {
    try {
      const resolvedAddress = await web3Provider.resolveName(address);
      return !!resolvedAddress;
    } catch (error) {
      return false;
    }
  }
  return isValidAddress(address);
};

/**
 * @desc validate seed phrase mnemonic
 * @param  {String} seed phrase mnemonic
 * @return {Boolean}
 */
const isValidSeedPhrase = seedPhrase => {
  const sanitizedSeedPhrase = sanitizeSeedPhrase(seedPhrase);
  return (
    sanitizedSeedPhrase.split(' ').length >= 12 &&
    isValidMnemonic(sanitizedSeedPhrase)
  );
};

/**
 * @desc validate private key string
 * @param  {String} private key string
 * @return {Boolean}
 */
const isValidPrivateKey = key => {
  return key.length >= 64 && isHexStringIgnorePrefix(key);
};

/**
 * @desc validate seed phrase mnemonic or private key
 * @param  {String} seed phrase mnemonic or private key
 * @return {Boolean}
 */
export const isValidSeed = seed =>
  seed && (isValidPrivateKey(seed) || isValidSeedPhrase(seed));

/**
 * @desc validates the input required to create a new wallet
 * @param  {String} seed, mnemonic, private key, address or ENS name
 * @return {Boolean}
 */
export const isValidWallet = seed =>
  seed &&
  (isValidPrivateKey(seed) ||
    isValidSeedPhrase(seed) ||
    isValidAddress(seed) ||
    isENSAddressFormat(seed));
