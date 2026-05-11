import { TransactionStatus } from '@/entities/transactions';

import { convertNewTransactionToRainbowTransaction } from './transactions';

jest.mock('@/resources/assets/assets', () => ({
  parseGoldskyAddressAsset: jest.fn(),
  parseGoldskyAsset: jest.fn(),
}));

describe('convertNewTransactionToRainbowTransaction', () => {
  it('normalizes pending replay fields to JSON-safe strings', () => {
    const transaction = convertNewTransactionToRainbowTransaction({
      chainId: 8453,
      data: Uint8Array.from([0xab, 0xcd]),
      from: null,
      gasLimit: 21000n,
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      maxFeePerGas: 100n,
      maxPriorityFeePerGas: 2n,
      network: 'Base',
      nonce: 7,
      status: TransactionStatus.pending,
      to: null,
      type: 'swap',
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
