import { ethers } from 'ethers';
import {
  isHexString,
  isValidMnemonic,
  mnemonicToSeed,
} from '../web3';

test('isHexString', () => {
  const address = '0x1492004547FF0eFd778CC2c14E794B26B4701105';
  const result = isHexString(address);
  expect(result).toBeTruthy();
});

test('isHexStringFalse', () => {
  const address = '1492004547FF0eFd778CC2c14E794B26B4701105';
  const result = isHexString(address);
  expect(result).toBeFalsy();
});

test('isHexStringFalse', () => {
  const address = '1492004547FF0eFd778CC2c14E794B26B470110';
  const result = isHexString(address);
  expect(result).toBeFalsy();
});

test('isValidMnemonic', () => {
  const seed = 'blah';
  const result = isValidMnemonic(seed);
  expect(result).toBeFalsy();
});
