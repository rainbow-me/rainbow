import { describe, expect, it, vi } from 'vitest';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { TransactionDirection, TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { activityValues } from '@/helpers/transactions';

import { convertNewTransactionToRainbowTransaction } from './transactions';

vi.mock('@/resources/assets/assets', () => ({
  parseGoldskyAddressAsset: vi.fn(),
  parseGoldskyAsset: vi.fn(),
}));

vi.mock('@/screens/token-launcher/state/rainbowSuperTokenStore', () => ({}));

const baseTransaction: NewTransaction = {
  chainId: 8453,
  from: null,
  hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
  network: 'Base',
  nonce: 7,
  status: TransactionStatus.pending,
  to: null,
  type: 'swap',
};

const walletAsset = {
  address: 'eth',
  balance: { amount: '7.246', display: '7.246 ETH' },
  chainId: 8453,
  decimals: 18,
  name: 'Ethereum',
  network: 'Base',
  symbol: 'ETH',
  uniqueId: 'eth_8453',
} satisfies ParsedAddressAsset;

describe('convertNewTransactionToRainbowTransaction', () => {
  it('keeps swap amounts correct after confirmation without changing wallet balances', () => {
    const boughtAsset = { ...walletAsset, decimals: 6, symbol: 'USDC', balance: { amount: '500', display: '500 USDC' } };
    const transaction = convertNewTransactionToRainbowTransaction({
      ...baseTransaction,
      changes: [
        { asset: walletAsset, direction: TransactionDirection.OUT, value: '10000000000000000' },
        { asset: boughtAsset, direction: TransactionDirection.IN, value: '2000000' },
      ],
    });

    expect(activityValues(transaction, 'USD')).toEqual(['0.01 ETH', '+2.00 USDC']);
    expect(activityValues({ ...transaction, status: TransactionStatus.confirmed }, 'USD')).toEqual(['0.01 ETH', '+2.00 USDC']);
    expect(transaction.changes?.map(change => change?.asset.balance)).toEqual([
      { amount: '0.01', display: '0.01 ETH' },
      { amount: '2', display: '2.00 USDC' },
    ]);
    expect(transaction.asset).toBe(transaction.changes?.[0]?.asset);
    expect(walletAsset.balance.amount).toBe('7.246');
    expect(boughtAsset.balance.amount).toBe('500');
  });

  it('normalizes zero amounts and preserves changes without a fungible amount', () => {
    const withoutValue = { asset: walletAsset, direction: TransactionDirection.OUT };
    const nft = { asset: { ...walletAsset, type: 'nft' }, direction: TransactionDirection.OUT, value: '1' };
    const transaction = convertNewTransactionToRainbowTransaction({
      ...baseTransaction,
      type: 'bridge',
      changes: [{ ...withoutValue, value: 0 }, withoutValue, nft, undefined],
    });

    expect(transaction.changes?.[0]?.asset.balance?.amount).toBe('0');
    expect(transaction.changes?.[1]).toBe(withoutValue);
    expect(transaction.changes?.[2]).toBe(nft);
    expect(transaction.changes?.[3]).toBeUndefined();
  });

  it('normalizes pending replay fields to JSON-safe strings', () => {
    const transaction = convertNewTransactionToRainbowTransaction({
      ...baseTransaction,
      data: Uint8Array.from([0xab, 0xcd]),
      gasLimit: 21000n,
      maxFeePerGas: 100n,
      maxPriorityFeePerGas: 2n,
      value: 5n,
    });

    expect(transaction).toEqual(
      expect.objectContaining({
        data: '0xabcd',
        gasLimit: '21000',
        maxFeePerGas: '100',
        maxPriorityFeePerGas: '2',
        value: '5',
      })
    );
    expect(() => JSON.stringify(transaction)).not.toThrow();
  });
});
