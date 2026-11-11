import { OperationType, RelayerTransactionState, type RelayerTransactionResponse } from '@polymarket/builder-relayer-client';
import { type Address } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUnwrapPusdToUsdcTransactions } from '@/features/polymarket/utils/collateral';
import { waitForRelayerTransaction } from '@/features/polymarket/utils/relayExecution';
import { logger } from '@/logger';

import { collectPolymarketTradeFee } from './collectPolymarketTradeFee';

const expectedFeeRecipient = '0x757758506d6a4F8a433F8BECaFd52545f9Cb050a';
const expectedProxyWallet: Address = '0x0000000000000000000000000000000000000001';
const mockRelayerResponse: RelayerTransactionResponse = {
  getTransaction: async () => [],
  hash: '',
  state: RelayerTransactionState.STATE_NEW,
  transactionHash: '',
  transactionID: 'fee-transaction',
  wait: async () => undefined,
};
const mockWallet = { address: expectedProxyWallet, execute: vi.fn(async () => mockRelayerResponse) };

vi.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_PUSD_DECIMALS: 6,
  POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS: '0x757758506d6a4F8a433F8BECaFd52545f9Cb050a',
}));

vi.mock('@/features/polymarket/utils/collateral', () => ({
  buildUnwrapPusdToUsdcTransactions: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/relayExecution', () => ({
  waitForRelayerTransaction: vi.fn(),
}));

vi.mock('@/logger', () => ({
  ensureError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
  logger: { error: vi.fn() },
  RainbowError: class RainbowError extends Error {},
}));

const mockBuildUnwrapPusdToUsdcTransactions = vi.mocked(buildUnwrapPusdToUsdcTransactions);
const mockWaitForRelayerTransaction = vi.mocked(waitForRelayerTransaction);
const mockLoggerError = vi.mocked(logger.error);

describe('collectPolymarketTradeFee', () => {
  beforeEach(() => {
    mockBuildUnwrapPusdToUsdcTransactions.mockReset();
    mockWaitForRelayerTransaction.mockReset();
    mockWallet.execute.mockClear();
    mockLoggerError.mockReset();
  });

  it('collects the capped fee through the bound wallet', async () => {
    const transaction = {
      to: '0xRecipient',
      data: '0x',
      value: '0',
      operation: OperationType.Call,
    };
    mockBuildUnwrapPusdToUsdcTransactions.mockResolvedValue([transaction]);

    const collection = collectPolymarketTradeFee({
      matchedAmounts: { tokens: '25', usd: '12.5' },
      orderId: 'order-1',
      quotedFeeUsd: '0.1000009',
      side: 'buy',
      tokenId: 'token-1',
      wallet: mockWallet,
    });
    await expect(collection).resolves.toBe('0.1');
    const buildCall = mockBuildUnwrapPusdToUsdcTransactions.mock.calls[0];
    expect(buildCall?.[0].amount.toString()).toBe('100000');
    expect(buildCall?.[0].proxyAddress).toBe(expectedProxyWallet);
    expect(buildCall?.[0].recipient).toBe(expectedFeeRecipient);
    expect(mockWallet.execute).toHaveBeenCalledWith([transaction], 'collect Rainbow Polymarket fee');
    expect(mockWaitForRelayerTransaction).toHaveBeenCalledWith(mockRelayerResponse, 'collect Rainbow Polymarket fee');
  });

  it('logs collection failures without throwing', async () => {
    mockBuildUnwrapPusdToUsdcTransactions.mockRejectedValue(new Error('allowance read failed'));

    await expect(
      collectPolymarketTradeFee({
        matchedAmounts: { tokens: '5', usd: '2.5' },
        orderId: 'order-2',
        quotedFeeUsd: '0.1',
        side: 'sell',
        tokenId: 'token-2',
        wallet: mockWallet,
      })
    ).resolves.toBe('0');

    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error), {
      feeAmountUsd: '0.075',
      matchedTokens: '5',
      matchedUsd: '2.5',
      orderId: 'order-2',
      quotedFeeUsd: '0.1',
      side: 'sell',
      tokenId: 'token-2',
    });
    expect(mockWallet.execute).not.toHaveBeenCalled();
  });

  it('skips relay work when the fee rounds to zero', async () => {
    const fee = await collectPolymarketTradeFee({
      wallet: mockWallet,
      matchedAmounts: { tokens: '0', usd: '0' },
      orderId: 'order-3',
      quotedFeeUsd: '0.1',
      side: 'buy',
      tokenId: 'token-3',
    });

    expect(fee).toBe('0');
    expect(mockBuildUnwrapPusdToUsdcTransactions).not.toHaveBeenCalled();
    expect(mockWallet.execute).not.toHaveBeenCalled();
  });
});
