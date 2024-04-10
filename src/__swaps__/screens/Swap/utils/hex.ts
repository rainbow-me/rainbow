import { isHexString } from '@ethersproject/bytes';
import BigNumber from 'bignumber.js';
import { startsWith } from 'lodash';

export type BigNumberish = number | string | BigNumber;

/**
 * @desc Checks if a hex string, ignoring prefixes and suffixes.
 * @param value The string.
 * @return Whether or not the string is a hex string.
 */
export const isHexStringIgnorePrefix = (value: string): boolean => {
  if (!value) return false;
  const trimmedValue = value.trim();
  const updatedValue = addHexPrefix(trimmedValue);
  return isHexString(updatedValue);
};

/**
 * @desc Adds an "0x" prefix to a string if one is not present.
 * @param value The starting string.
 * @return The prefixed string.
 */
export const addHexPrefix = (value: string): string => (startsWith(value, '0x') ? value : `0x${value}`);

export const addHexPrefixWorklet = (value: string): string => {
  'worklet';
  return startsWith(value, '0x') ? value : `0x${value}`;
};

export const convertStringToHex = (stringToConvert: string): string => new BigNumber(stringToConvert).toString(16);

export const toHex = (stringToConvert: string): string => addHexPrefix(convertStringToHex(stringToConvert));

export const toHexNoLeadingZeros = (value: string): string => toHex(value).replace(/^0x0*/, '0x');
