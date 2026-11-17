import { describe, expect, it } from 'vitest';

import { SOLANA_MAINNET_CHAIN as chain, parseSolanaBalances, solanaBalanceAccountId } from './balances';

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
