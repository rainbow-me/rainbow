import { describe, expect, it } from 'vitest';

import { resolveCirculatingSupply } from './marketCapSupply';

describe('resolveCirculatingSupply', () => {
  it.each<{ name: string; price: string; marketCap: string; usdToNativeRate: number | undefined; expected: string | null }>([
    { name: 'under $1 with a market cap', price: '0.5', marketCap: '1000', usdToNativeRate: 1, expected: '2000' },
    { name: 'exactly $1', price: '1', marketCap: '1000', usdToNativeRate: 1, expected: null },
    { name: 'over $1', price: '2', marketCap: '1000', usdToNativeRate: 1, expected: null },
    { name: 'under $1 though over 1 in the native currency', price: '150', marketCap: '3000', usdToNativeRate: 300, expected: '20' },
    { name: 'over $1 though under 1 in the native currency', price: '0.5', marketCap: '1000', usdToNativeRate: 0.25, expected: null },
    { name: 'no conversion rate', price: '0.5', marketCap: '1000', usdToNativeRate: undefined, expected: null },
    { name: 'no price', price: '', marketCap: '1000', usdToNativeRate: 1, expected: null },
    { name: 'zero price', price: '0', marketCap: '1000', usdToNativeRate: 1, expected: null },
    { name: 'no market cap', price: '0.5', marketCap: '0', usdToNativeRate: 1, expected: null },
  ])('$name', ({ price, marketCap, usdToNativeRate, expected }) => {
    expect(resolveCirculatingSupply({ price, marketCap, usdToNativeRate })).toBe(expected);
  });
});
