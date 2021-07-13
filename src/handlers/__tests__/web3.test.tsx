import { isHexString, isValidMnemonic } from '../web3';

it('isHexString', () => {
  const address = '0x1492004547FF0eFd778CC2c14E794B26B4701105';
  const result = isHexString(address);
  expect(result).toBeTruthy();
});

it('isHexStringFalse', () => {
  const address = '1492004547FF0eFd778CC2c14E794B26B4701105';
  const result = isHexString(address);
  expect(result).toBeFalsy();
});

it('isHexStringFalse2', () => {
  const address = '1492004547FF0eFd778CC2c14E794B26B470110';
  const result = isHexString(address);
  expect(result).toBeFalsy();
});

it('isValidMnemonic', () => {
  const seed = 'blah';
  const result = isValidMnemonic(seed);
  expect(result).toBeFalsy();
});
