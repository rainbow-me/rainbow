import { describe, expect, it } from 'vitest';

import { parseSolanaBalances, solanaBalanceAccountId } from './balances';
import { SOLANA_MAINNET_CHAIN as chain } from './chainId';

const address = 'EXzw16qKGtrWTaTd5gGG29FWSUDrTEDheh5ber156MNS';
const accountId = solanaBalanceAccountId(address);
const sol = {
  accountId,
  quantity: '3676013',
  value: '0',
  asset: {
    assetId: `${chain}/native:So11111111111111111111111111111111111111111`,
    chainId: chain,
  },
};
const usdc = {
  accountId,
  quantity: '179207',
  value: '0',
  asset: {
    assetId: `${chain}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
    chainId: chain,
    decimals: 6,
  },
};
const response = (balances: unknown[] = [sol, usdc]) => ({ metadata: { success: true, currency: 'USD' }, result: { balances } });

describe('balances v2 boundary', () => {
  it('handles the live response with absent SOL decimals, labels, and prices', () => {
    const data = parseSolanaBalances(response(), address, 'USD');
    expect(data.balances).toEqual([
      expect.objectContaining({ name: 'Solana', symbol: 'SOL', amount: '0.003676013', value: null, rawUnits: false }),
      expect.objectContaining({ name: 'USD Coin', symbol: 'USDC', amount: '0.179207', value: null, rawUnits: false }),
    ]);
    expect(data.total).toBe('0');
  });
  it('uses backend metadata, direct token icons and priced balances', () => {
    const iconUrl = 'https://token-media.defined.fi/bonk.png';
    const data = parseSolanaBalances(
      response([
        {
          ...sol,
          value: '1.2699333673753511952',
          asset: {
            ...sol.asset,
            name: 'Solana',
            symbol: 'SOL',
            decimals: 9,
            iconUrl: 'https://token-media.defined.fi/sol.png',
            price: { value: 73.7896106781, relativeChange24h: 2.2169296146002506 },
          },
        },
        {
          ...usdc,
          quantity: '41560000000',
          value: '0.975437580837364',
          asset: {
            ...usdc.asset,
            assetId: `${chain}/token:DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`,
            name: 'Backend Bonk',
            symbol: 'BONK',
            decimals: 5,
            iconUrl,
            price: { value: 0.00000234705866419, relativeChange24h: -0.5812386644957772 },
          },
        },
      ]),
      address,
      'USD'
    );
    expect(data.total).toBe('2.2453709482127151952');
    expect(data.balances[0]).toMatchObject({ symbol: 'SOL', relativeChange24h: 2.2169296146002506 });
    expect(data.balances[1]).toMatchObject({
      name: 'Backend Bonk',
      symbol: 'BONK',
      amount: '415600',
      iconUrl,
      relativeChange24h: -0.5812386644957772,
    });
  });
  it('keeps missing metadata optional and preserves a zero price change', () => {
    const data = parseSolanaBalances(
      response([
        { ...sol, asset: { ...sol.asset, iconUrl: '', price: { value: 0, relativeChange24h: 0 } } },
        { ...usdc, asset: { ...usdc.asset, price: null } },
      ]),
      address,
      'USD'
    );
    expect(data.balances[0]).toMatchObject({ iconUrl: undefined, relativeChange24h: 0, value: null });
    expect(data.balances[1]).toMatchObject({ iconUrl: undefined, relativeChange24h: undefined });
  });
  it('uses exact quantities and sums only available valuations', () => {
    const data = parseSolanaBalances(
      response([
        { ...sol, quantity: '9007199254740993123', value: '0.1' },
        { ...usdc, value: '0.2' },
      ]),
      address,
      'USD'
    );
    expect(data.total).toBe('0.3');
    expect(data.balances.find(b => b.symbol === 'SOL')?.amount).toBe('9007199254.740993123');
  });
  it('distinguishes failed accounts and absent responses from confirmed empty balances', () => {
    expect(parseSolanaBalances({ metadata: { success: true, currency: 'USD' }, result: {} }, address, 'USD').balances).toEqual([]);
    expect(() => parseSolanaBalances({ ...response(), result: { failedQueries: [{ accountId }] } }, address, 'USD')).toThrow();
    expect(() => parseSolanaBalances({ metadata: { success: true, currency: 'USD' } }, address, 'USD')).toThrow();
    expect(() => parseSolanaBalances({ ...response(), errors: ['upstream unavailable'] }, address, 'USD')).toThrow();
    expect(parseSolanaBalances(response([{ ...sol, quantity: '0' }]), address, 'USD').balances).toEqual([]);
  });
  it('rejects wrong accounts, currencies, chains, duplicates, and malformed amounts', () => {
    for (const item of [
      { ...sol, accountId: accountId.toLowerCase() },
      { ...sol, quantity: '-1' },
      { ...sol, value: 'NaN' },
      { ...sol, asset: { ...sol.asset, chainId: 'eip155:1' } },
      { ...sol, asset: { ...sol.asset, decimals: 6 } },
      { ...sol, asset: { ...sol.asset, assetId: `${chain}/token:invalid` } },
    ])
      expect(() => parseSolanaBalances(response([item]), address, 'USD')).toThrow();
    expect(() => parseSolanaBalances(response([sol, sol]), address, 'USD')).toThrow();
    expect(() => parseSolanaBalances(response(), address, 'EUR')).toThrow();
    expect(() => solanaBalanceAccountId(accountId)).toThrow();
  });
  it('does not guess unknown token decimals or prices', () => {
    const data = parseSolanaBalances(
      response([
        {
          ...usdc,
          asset: {
            assetId: `${chain}/token:${address}`,
            chainId: chain,
          },
        },
      ]),
      address,
      'USD'
    );
    expect(data.balances[0]).toMatchObject({ name: 'EXzw…6MNS', amount: '179207', rawUnits: true, value: null });
  });
});

it('creates case-sensitive address_chainId IDs while retaining native and wrapped SOL as different assets', () => {
  const wrapped = { ...sol, asset: { ...sol.asset, assetId: `${chain}/token:So11111111111111111111111111111111111111112`, decimals: 9 } };
  const result = parseSolanaBalances(response([sol, usdc, wrapped]), address, 'USD');
  const ids = result.balances.map(balance => balance.uniqueId);
  expect(ids).toContain('So11111111111111111111111111111111111111111_1399811149');
  expect(ids).toContain('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v_1399811149');
  expect(ids).toContain('So11111111111111111111111111111111111111112_1399811149');
  expect(new Set(ids).size).toBe(3);
  expect(result.balances).toContainEqual(
    expect.objectContaining({
      uniqueId: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v_1399811149',
      assetId: usdc.asset.assetId,
    })
  );
});

it('rejects backend entries that would collide after conversion to row IDs', () => {
  const alias = { ...sol, asset: { ...sol.asset, assetId: `${chain}/token:So11111111111111111111111111111111111111111` } };
  expect(() => parseSolanaBalances(response([sol, alias]), address, 'USD')).toThrow('Invalid Solana balance identity.');
});
