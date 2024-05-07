import { isAddress } from '@ethersproject/address';
import { Mnemonic, isValidMnemonic } from '@ethersproject/hdnode';
import { TransactionResponse } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import omit from 'lodash/omit';
import { Address } from 'viem';
import { EthereumPrivateKey } from '@/model/wallet';
import { ethUnits } from '@/references';

import { addHexPrefix, isHexStringIgnorePrefix } from '@/__swaps__/utils/hex';
import { divide, multiply } from '@/__swaps__/utils/numbers';

export type EthereumWalletSeed = EthereumPrivateKey | Mnemonic['phrase'];
export enum EthereumWalletType {
  mnemonic = 'mnemonic',
  privateKey = 'privateKey',
  readOnly = 'readOnly',
  seed = 'seed',
  ledgerPublicKey = 'ledgerPublicKey',
  trezorPublicKey = 'trezorPublicKey',
}

const validTLDs = ['eth', 'xyz', 'luxe', 'kred', 'reverse', 'addr', 'test'];
export const isENSAddressFormat = (name: string) => {
  if (!name) return false;
  const tld = name.split('.').at(-1);
  if (!tld || tld === name) return false;
  return validTLDs.includes(tld.toLowerCase());
};

/**
 * @desc Checks if a string is a valid private key.
 * @param value The string.
 * @return Whether or not the string is a valid private key string.
 */
export const isValidPrivateKey = (value: string): boolean => {
  return isHexStringIgnorePrefix(value) && addHexPrefix(value).length === 66;
};

export const identifyWalletType = (walletSeed: EthereumWalletSeed): EthereumWalletType => {
  if (isValidPrivateKey(walletSeed)) {
    return EthereumWalletType.privateKey;
  }
  // 12 or 24 words seed phrase
  if (isValidMnemonic(walletSeed)) {
    return EthereumWalletType.mnemonic;
  }
  // Public address (0x)
  if (isAddress(walletSeed)) {
    return EthereumWalletType.readOnly;
  }
  // seed
  return EthereumWalletType.seed;
};

/**
 * @desc Checks if a an address has previous transactions
 * @param  {String} address
 * @return {Promise<Boolean>}
 */
export const hasPreviousTransactions = async (address: Address): Promise<boolean> => {
  try {
    const url = `https://aha.rainbow.me/?address=${address}`;
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }

    const parsedResponse = (await response.json()) as {
      data: { addresses: Record<string, boolean> };
    };

    return parsedResponse?.data?.addresses[address.toLowerCase()] === true;
  } catch (e) {
    return false;
  }
};

export const gweiToWei = (gweiAmount: string) => {
  const weiAmount = multiply(gweiAmount, ethUnits.gwei);
  return weiAmount;
};

export const weiToGwei = (weiAmount: string) => {
  const gweiAmount = divide(weiAmount, ethUnits.gwei);
  return gweiAmount;
};

export const toWei = (ether: string): string => {
  const result = parseEther(ether);
  return result.toString();
};

export const normalizeTransactionResponsePayload = (payload: TransactionResponse): TransactionResponse => {
  // Firefox can't serialize functions
  if (navigator.userAgent.toLowerCase().includes('firefox')) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return omit(payload, 'wait') as TransactionResponse;
  }
  return payload;
};

// This function removes all the keys from the message that are not present in the types
// preventing a know phising attack where the signature process could allow malicious DApps
// to trick users into signing an EIP-712 object different from the one presented
// in the signature approval preview. Consequently, users were at risk of unknowingly
// transferring control of their ERC-20 tokens, NFTs, etc to adversaries by signing
// hidden Permit messages.

// For more info read https://www.coinspect.com/wallet-EIP-712-injection-vulnerability/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeTypedData = (data: any) => {
  if (data.types[data.primaryType].length > 0) {
    // Extract all the valid permit types for the primary type
    const permitPrimaryTypes: string[] = data.types[data.primaryType].map((type: { name: string; type: string }) => type.name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitizedMessage: any = {};
    // Extract all the message keys that matches the valid permit types
    Object.keys(data.message).forEach(key => {
      if (permitPrimaryTypes.includes(key)) {
        sanitizedMessage[key] = data.message[key];
      }
    });

    const sanitizedData = {
      ...data,
      message: sanitizedMessage,
    };

    return sanitizedData;
  }
  return data;
};
