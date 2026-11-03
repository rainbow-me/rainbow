import { type RelayerTransaction, type RelayerTransactionResponse } from '@polymarket/builder-relayer-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analytics } from '@/analytics';
import { getPolymarketWallet } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { waitForRelayerTransaction } from '@/features/polymarket/utils/relayExecution';
import { getMissingOperatorApproval } from '@/features/polymarket/utils/tradingApprovals';
import { logger } from '@/logger';

import { redeemPosition } from './redeemPosition';

const proxyWallet = '0x0000000000000000000000000000000000000001';
const ctfAddress = '0x0000000000000000000000000000000000000009';
const adapterAddress = '0x0000000000000000000000000000000000000010';
const mockResponse: RelayerTransactionResponse = {
  getTransaction: async () => [],
  hash: '',
  state: 'STATE_NEW',
  transactionHash: '',
  transactionID: 'redemption-1',
  wait: async () => mockTransaction,
};
const mockWallet = { address: proxyWallet, execute: vi.fn(async () => mockResponse) };
const mockTransaction: RelayerTransaction = {
  createdAt: new Date(0),
  data: '0x',
  from: '0x0000000000000000000000000000000000000002',
  metadata: '',
  nonce: '0',
  proxyAddress: proxyWallet,
  state: 'STATE_CONFIRMED',
  to: adapterAddress,
  transactionHash: '0xhash',
  transactionID: 'transaction-1',
  type: 'SAFE',
  updatedAt: new Date(0),
  value: '0',
};

vi.mock('@/analytics', () => ({
  analytics: {
    event: {
      predictionsRedeemPosition: 'predictions.redeem_position',
      predictionsRedeemPositionFailed: 'predictions.redeem_position_failed',
    },
    track: vi.fn(),
  },
}));

vi.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_CTF_ADDRESS: '0x0000000000000000000000000000000000000009',
  POLYMARKET_CTF_COLLATERAL_ADAPTER_ADDRESS: '0x0000000000000000000000000000000000000010',
  POLYMARKET_NEG_RISK_CTF_COLLATERAL_ADAPTER_ADDRESS: '0x0000000000000000000000000000000000000020',
  POLYMARKET_PUSD_ADDRESS: '0x0000000000000000000000000000000000000030',
}));

vi.mock('@/handlers/web3', () => ({ getProvider: vi.fn() }));

vi.mock('@/features/polymarket/stores/derived/usePolymarketClients', () => ({
  getPolymarketWallet: vi.fn(async () => mockWallet),
}));

vi.mock('@/features/polymarket/utils/relayExecution', () => ({
  waitForRelayerTransaction: vi.fn(async () => mockTransaction),
}));

vi.mock('@/features/polymarket/utils/tradingApprovals', () => ({
  getMissingOperatorApproval: vi.fn(async () => []),
}));

vi.mock('@/logger', () => ({
  ensureError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
  logger: { error: vi.fn() },
  RainbowError: class RainbowError extends Error {},
}));

const mockAnalyticsTrack = vi.mocked(analytics.track);
const mockGetMissingOperatorApproval = vi.mocked(getMissingOperatorApproval);
const mockGetPolymarketWallet = vi.mocked(getPolymarketWallet);
const mockWaitForRelayerTransaction = vi.mocked(waitForRelayerTransaction);
const mockLoggerError = vi.mocked(logger.error);

describe('redeemPosition', () => {
  beforeEach(() => {
    mockAnalyticsTrack.mockReset();
    mockGetPolymarketWallet.mockClear();
    mockGetMissingOperatorApproval.mockClear();
    mockWaitForRelayerTransaction.mockClear();
    mockWallet.execute.mockClear();
    mockLoggerError.mockReset();
  });

  it('returns after relay acceptance and settles through the same captured wallet', async () => {
    let confirmRedemption!: (transaction: typeof mockTransaction) => void;
    mockWaitForRelayerTransaction.mockReturnValueOnce(
      new Promise(resolve => {
        confirmRedemption = resolve;
      })
    );

    const redemption = await redeemPosition(createPosition());

    expect(mockGetPolymarketWallet).toHaveBeenCalledTimes(1);
    expect(mockGetPolymarketWallet).toHaveBeenCalledWith(proxyWallet);
    expect(mockGetMissingOperatorApproval).toHaveBeenCalledWith(proxyWallet, ctfAddress, adapterAddress);
    expect(mockWallet.execute).toHaveBeenCalledWith([expect.objectContaining({ to: adapterAddress })], 'Redeem position');
    expect(mockWaitForRelayerTransaction).toHaveBeenCalledWith(mockResponse, 'Redeem position');
    expect(mockAnalyticsTrack).not.toHaveBeenCalled();
    expect(redemption.transactionId).toBe('redemption-1');

    confirmRedemption(mockTransaction);
    await expect(redemption.outcome).resolves.toBe('confirmed');
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('predictions.redeem_position', expect.objectContaining({ type: 'claim' }));
  });

  it('reports a failed settlement to the optimistic reconciliation caller', async () => {
    mockWaitForRelayerTransaction.mockRejectedValueOnce(new Error('settlement failed'));

    const redemption = await redeemPosition(createPosition());

    await expect(redemption.outcome).resolves.toBe('failed');
    expect(mockAnalyticsTrack).toHaveBeenCalledWith(
      'predictions.redeem_position_failed',
      expect.objectContaining({ errorMessage: 'settlement failed', type: 'claim' })
    );
  });

  it('keeps a confirmed settlement authoritative when analytics throws', async () => {
    mockAnalyticsTrack.mockImplementationOnce(() => {
      throw new Error('analytics failed');
    });

    const redemption = await redeemPosition(createPosition());

    await expect(redemption.outcome).resolves.toBe('confirmed');
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });

  it('does not redeem a position owned by another proxy wallet', async () => {
    const otherHolder = '0x0000000000000000000000000000000000000002';
    mockGetPolymarketWallet.mockRejectedValueOnce(new Error('Trading wallet does not match the requested account'));

    await expect(redeemPosition({ ...createPosition(), proxyWallet: otherHolder })).rejects.toThrow('Trading wallet does not match');
    expect(mockGetPolymarketWallet).toHaveBeenCalledWith(otherHolder);
    expect(mockWallet.execute).not.toHaveBeenCalled();
  });
});

function createPosition(): Parameters<typeof redeemPosition>[0] {
  return {
    asset: '101',
    market: { version: 'v1', clobTokenIds: ['101', '102'] },
    conditionId: '0x0000000000000000000000000000000000000000000000000000000000000001',
    currentValue: 10,
    eventSlug: 'event',
    negativeRisk: false,
    outcome: 'Yes',
    proxyWallet,
    size: 10,
    slug: 'market',
  };
}
