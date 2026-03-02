import { getAddress } from 'viem';
import { RainbowError } from '@/logger';
import { createQuote } from './fixtures';
import { getQuoteAllowanceTargetAddress, requireAddress, requireHex } from '../validation';

describe('RAP validation boundary invariants', () => {
  test('requireAddress validates and normalizes to viem Address shape', () => {
    const rawAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const normalizedAddress = requireAddress(rawAddress, 'token address');

    expect(normalizedAddress).toBe(getAddress(rawAddress));
  });

  test('requireAddress throws RainbowError when missing or invalid', () => {
    expect(() => requireAddress(undefined, 'token address')).toThrow(RainbowError);
    expect(() => requireAddress(undefined, 'token address')).toThrow('[raps/validation]: Missing token address');

    expect(() => requireAddress('not-an-address', 'token address')).toThrow(RainbowError);
    expect(() => requireAddress('not-an-address', 'token address')).toThrow('[raps/validation]: Invalid token address');
  });

  test('requireHex narrows valid hex values and throws for invalid input', () => {
    expect(requireHex('0x1234', 'tx data')).toBe('0x1234');

    expect(() => requireHex('1234', 'tx data')).toThrow(RainbowError);
    expect(() => requireHex('1234', 'tx data')).toThrow('[raps/validation]: Invalid tx data');
  });

  test('getQuoteAllowanceTargetAddress validates and normalizes quote allowanceTarget', () => {
    const quote = createQuote({
      allowanceTarget: '0x00000000009726632680fb29d3f7a9734e3010e2',
    });

    expect(getQuoteAllowanceTargetAddress(quote)).toBe(getAddress(quote.allowanceTarget));
  });

  test('getQuoteAllowanceTargetAddress throws when quote allowanceTarget is invalid', () => {
    const quote = createQuote({
      allowanceTarget: 'invalid',
    });

    expect(() => getQuoteAllowanceTargetAddress(quote)).toThrow(RainbowError);
    expect(() => getQuoteAllowanceTargetAddress(quote)).toThrow('[raps/validation]: Invalid quote.allowanceTarget');
  });
});
