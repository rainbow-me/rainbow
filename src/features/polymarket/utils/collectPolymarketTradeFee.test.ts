import { OperationType } from '@polymarket/builder-relayer-client';

import { buildUnwrapPusdToUsdcTransactions } from '@/features/polymarket/utils/collateral';
import { getPolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { executeRelayTransaction } from '@/features/polymarket/utils/relayExecution';
import { logger } from '@/logger';

import { collectPolymarketTradeFee } from './collectPolymarketTradeFee';

const expectedFeeRecipient = '0x757758506d6a4F8a433F8BECaFd52545f9Cb050a';

jest.mock('@/state/wallets/walletsStore', () => ({
  useWalletsStore: {
    getState: jest.fn(() => ({ accountAddress: '0x1208C8B837F68468457c83DD256e817BD5B3E0b7' })),
  },
}));

jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_PUSD_DECIMALS: 6,
  POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS: '0x757758506d6a4F8a433F8BECaFd52545f9Cb050a',
}));

jest.mock('@/features/polymarket/utils/collateral', () => ({
  buildUnwrapPusdToUsdcTransactions: jest.fn(),
}));

jest.mock('@/features/polymarket/utils/polymarketWallet', () => ({
  getPolymarketWallet: jest.fn(async () => ({ address: '0xProxy' })),
}));

jest.mock('@/features/polymarket/utils/relayExecution', () => ({
  executeRelayTransaction: jest.fn(),
}));

jest.mock('@/logger', () => ({
  ensureError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
  logger: { error: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

const mockBuildUnwrapPusdToUsdcTransactions = jest.mocked(buildUnwrapPusdToUsdcTransactions);
const mockExecuteRelayTransaction = jest.mocked(executeRelayTransaction);
const mockGetPolymarketWallet = jest.mocked(getPolymarketWallet);
const mockLoggerError = jest.mocked(logger.error);

describe('collectPolymarketTradeFee', () => {
  beforeEach(() => {
    mockBuildUnwrapPusdToUsdcTransactions.mockReset();
    mockExecuteRelayTransaction.mockReset();
    mockGetPolymarketWallet.mockClear();
    mockLoggerError.mockReset();
  });

  it('submits capped fee transactions through the current relayer', async () => {
    const transaction = {
      to: '0xRecipient',
      data: '0x',
      value: '0',
      operation: OperationType.Call,
    };
    mockBuildUnwrapPusdToUsdcTransactions.mockResolvedValue([transaction]);

    await collectPolymarketTradeFee({
      matchedAmounts: { tokens: '25', usd: '12.5' },
      orderId: 'order-1',
      quotedFeeUsd: '0.1',
      side: 'buy',
      tokenId: 'token-1',
    });

    const buildCall = mockBuildUnwrapPusdToUsdcTransactions.mock.calls[0];
    expect(buildCall?.[0].amount.toString()).toBe('100000');
    expect(buildCall?.[0].proxyAddress).toBe('0xProxy');
    expect(buildCall?.[0].recipient).toBe(expectedFeeRecipient);
    expect(mockExecuteRelayTransaction).toHaveBeenCalledWith([transaction], 'collect Rainbow Polymarket fee');
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
    expect(mockExecuteRelayTransaction).not.toHaveBeenCalled();
  });

  it('skips wallet lookup and relayer work when the fee rounds to zero', async () => {
    await collectPolymarketTradeFee({
      matchedAmounts: { tokens: '0', usd: '0' },
      orderId: 'order-3',
      quotedFeeUsd: '0.1',
      side: 'buy',
      tokenId: 'token-3',
    });

    expect(mockGetPolymarketWallet).not.toHaveBeenCalled();
    expect(mockBuildUnwrapPusdToUsdcTransactions).not.toHaveBeenCalled();
    expect(mockExecuteRelayTransaction).not.toHaveBeenCalled();
  });
});
