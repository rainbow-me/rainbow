import { OperationType } from '@polymarket/builder-relayer-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUnwrapPusdToUsdcTransactions } from '@/features/polymarket/utils/collateral';
import { awaitPolygonConfirmation } from '@/features/polymarket/utils/confirmation';
import { logger } from '@/logger';

import { collectPolymarketTradeFee } from './collectPolymarketTradeFee';

const expectedFeeRecipient = '0x757758506d6a4F8a433F8BECaFd52545f9Cb050a';

vi.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_PUSD_DECIMALS: 6,
  POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS: '0x757758506d6a4F8a433F8BECaFd52545f9Cb050a',
}));

vi.mock('@/features/polymarket/utils/confirmation', () => ({
  awaitPolygonConfirmation: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/collateral', () => ({
  buildUnwrapPusdToUsdcTransactions: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/relayExecution', () => ({ waitForRelayerTransaction: vi.fn() }));

vi.mock('@/logger', () => ({
  ensureError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
  logger: { error: vi.fn() },
  RainbowError: class RainbowError extends Error {},
}));

const mockBuildUnwrapPusdToUsdcTransactions = vi.mocked(buildUnwrapPusdToUsdcTransactions);
const wallet = { address: '0x0000000000000000000000000000000000000001', execute: vi.fn() } as const;
const mockAwaitPolygonConfirmation = vi.mocked(awaitPolygonConfirmation);
const mockLoggerError = vi.mocked(logger.error);

describe('collectPolymarketTradeFee', () => {
  beforeEach(() => {
    mockAwaitPolygonConfirmation.mockReset();
    mockBuildUnwrapPusdToUsdcTransactions.mockReset();
    wallet.execute.mockReset();
    mockLoggerError.mockReset();

    mockAwaitPolygonConfirmation.mockResolvedValue(undefined);
  });

  it('submits capped fee transactions from the order wallet', async () => {
    const transaction = {
      to: '0xRecipient',
      data: '0x',
      value: '0',
      operation: OperationType.Call,
    };
    mockBuildUnwrapPusdToUsdcTransactions.mockResolvedValue([transaction]);

    await collectPolymarketTradeFee({
      wallet,
      matchedAmounts: { tokens: '25', usd: '12.5' },
      orderId: 'order-1',
      quotedFeeUsd: '0.1',
      settlementTransactionHashes: ['0xsettlement'],
      side: 'buy',
      tokenId: 'token-1',
    });

    const buildCall = mockBuildUnwrapPusdToUsdcTransactions.mock.calls[0];
    expect(buildCall?.[0].amount.toString()).toBe('100000');
    expect(buildCall?.[0].proxyAddress).toBe(wallet.address);
    expect(buildCall?.[0].recipient).toBe(expectedFeeRecipient);
    expect(wallet.execute).toHaveBeenCalledWith([transaction], 'collect Rainbow Polymarket fee');
  });

  it('waits for matched order settlement before submitting fee transactions', async () => {
    const transaction = {
      to: '0xRecipient',
      data: '0x',
      value: '0',
      operation: OperationType.Call,
    };
    let confirmSettlement!: () => void;
    mockAwaitPolygonConfirmation.mockResolvedValueOnce(undefined).mockReturnValueOnce(
      new Promise<void>(resolve => {
        confirmSettlement = resolve;
      })
    );
    mockBuildUnwrapPusdToUsdcTransactions.mockResolvedValue([transaction]);

    const promise = collectPolymarketTradeFee({
      wallet,
      matchedAmounts: { tokens: '25', usd: '12.5' },
      orderId: 'order-1',
      quotedFeeUsd: '0.1',
      settlementTransactionHashes: ['0xsettlement-1', '0xsettlement-2'],
      side: 'buy',
      tokenId: 'token-1',
    });
    await Promise.resolve();

    expect(mockAwaitPolygonConfirmation).toHaveBeenNthCalledWith(1, '0xsettlement-1');
    expect(mockAwaitPolygonConfirmation).toHaveBeenNthCalledWith(2, '0xsettlement-2');
    expect(mockBuildUnwrapPusdToUsdcTransactions).not.toHaveBeenCalled();
    expect(wallet.execute).not.toHaveBeenCalled();

    confirmSettlement();
    await promise;

    expect(mockBuildUnwrapPusdToUsdcTransactions).toHaveBeenCalled();
    expect(wallet.execute).toHaveBeenCalledWith([transaction], 'collect Rainbow Polymarket fee');
  });

  it('logs collection failures without throwing', async () => {
    mockBuildUnwrapPusdToUsdcTransactions.mockRejectedValue(new Error('allowance read failed'));

    await expect(
      collectPolymarketTradeFee({
        wallet,
        matchedAmounts: { tokens: '5', usd: '2.5' },
        orderId: 'order-2',
        quotedFeeUsd: '0.1',
        settlementTransactionHashes: ['0xsettlement'],
        side: 'sell',
        tokenId: 'token-2',
      })
    ).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith(expect.any(Error), {
      feeAmountUsd: '0.075',
      matchedTokens: '5',
      matchedUsd: '2.5',
      orderId: 'order-2',
      quotedFeeUsd: '0.1',
      side: 'sell',
      tokenId: 'token-2',
    });
    expect(wallet.execute).not.toHaveBeenCalled();
  });

  it('skips relay work when the fee rounds to zero', async () => {
    await collectPolymarketTradeFee({
      wallet,
      matchedAmounts: { tokens: '0', usd: '0' },
      orderId: 'order-3',
      quotedFeeUsd: '0.1',
      settlementTransactionHashes: ['0xsettlement'],
      side: 'buy',
      tokenId: 'token-3',
    });

    expect(mockBuildUnwrapPusdToUsdcTransactions).not.toHaveBeenCalled();
    expect(wallet.execute).not.toHaveBeenCalled();
  });
});
