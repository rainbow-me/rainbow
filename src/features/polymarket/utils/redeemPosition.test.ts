import { type RelayerTransaction, type RelayerTransactionResponse } from '@polymarket/builder-relayer-client';
import { type Address } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analytics } from '@/analytics';
import { getPolymarketWallet } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { polymarketBalanceActions } from '@/features/polymarket/stores/polymarketBalanceStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';
import { createPosition as createPositionFixture } from '@/features/polymarket/test/fixtures';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { waitForRelayerTransaction } from '@/features/polymarket/utils/relayExecution';
import { getMissingOperatorApproval } from '@/features/polymarket/utils/tradingApprovals';

import { redeemPosition } from './redeemPosition';

const proxyWallet: Address = '0x0000000000000000000000000000000000000001';
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

vi.mock('@/features/polymarket/stores/polymarketBalanceStore', () => ({
  polymarketBalanceActions: { beginUpdate: vi.fn() },
}));
vi.mock('@/features/polymarket/stores/polymarketPositionsStore', () => ({
  polymarketPositionsActions: { remove: vi.fn() },
}));
vi.mock('@/features/polymarket/utils/refetchPolymarketStores', () => ({ refetchPolymarketStores: vi.fn() }));

const balanceUpdate = { apply: vi.fn(), finalize: vi.fn(), discard: vi.fn() };
const positionUpdate = { discard: vi.fn() };

vi.mock('@/logger', () => ({
  ensureError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
  logger: { error: vi.fn() },
  RainbowError: class RainbowError extends Error {},
}));

const mockAnalyticsTrack = vi.mocked(analytics.track);
const mockGetMissingOperatorApproval = vi.mocked(getMissingOperatorApproval);
const mockGetPolymarketWallet = vi.mocked(getPolymarketWallet);
const mockWaitForRelayerTransaction = vi.mocked(waitForRelayerTransaction);

describe('redeemPosition', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetPolymarketWallet.mockResolvedValue(mockWallet);
    mockGetMissingOperatorApproval.mockResolvedValue([]);
    mockWaitForRelayerTransaction.mockResolvedValue(mockTransaction);
    mockWallet.execute.mockResolvedValue(mockResponse);
    vi.mocked(polymarketBalanceActions.beginUpdate).mockReturnValue(balanceUpdate);
    vi.mocked(polymarketPositionsActions.remove).mockReturnValue(positionUpdate);
  });

  it.each([
    { action: 'claim', value: 10 },
    { action: 'burn', value: 0 },
  ])('publishes an accepted $action before confirmation and refreshes its wallet afterward', async ({ action, value }) => {
    const confirmation = Promise.withResolvers<RelayerTransaction>();
    mockWaitForRelayerTransaction.mockReturnValueOnce(confirmation.promise);
    const position = createPosition({ currentValue: value });
    mockWallet.execute.mockImplementationOnce(async () => {
      expect(polymarketBalanceActions.beginUpdate).toHaveBeenCalledTimes(value ? 1 : 0);
      expect(polymarketPositionsActions.remove).not.toHaveBeenCalled();
      expect(balanceUpdate.apply).not.toHaveBeenCalled();
      return mockResponse;
    });

    const redemption = await redeemPosition(position);

    expect(mockGetMissingOperatorApproval).toHaveBeenCalledWith(proxyWallet, ctfAddress, adapterAddress);
    expect(mockWallet.execute).toHaveBeenCalledWith([expect.objectContaining({ to: adapterAddress })], 'Redeem position');
    expect(mockWaitForRelayerTransaction).toHaveBeenCalledWith(mockResponse, 'Redeem position');
    expect(polymarketPositionsActions.remove).toHaveBeenCalledWith(position);
    expect(vi.mocked(polymarketBalanceActions.beginUpdate).mock.calls).toEqual(value ? [[proxyWallet]] : []);
    expect(balanceUpdate.apply.mock.calls).toEqual(value ? [[String(value)]] : []);
    expect(balanceUpdate.finalize).not.toHaveBeenCalled();
    expect(refetchPolymarketStores).not.toHaveBeenCalled();
    expect(mockAnalyticsTrack).not.toHaveBeenCalled();

    mockGetPolymarketWallet.mockRejectedValueOnce(new Error('active account changed'));
    confirmation.resolve(mockTransaction);
    await redemption.followUp;

    expect(mockGetPolymarketWallet).toHaveBeenCalledExactlyOnceWith(proxyWallet);
    expect(balanceUpdate.finalize).toHaveBeenCalledTimes(value ? 1 : 0);
    expect(positionUpdate.discard).not.toHaveBeenCalled();
    expect(refetchPolymarketStores).toHaveBeenCalledWith(proxyWallet);
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('predictions.redeem_position', expect.objectContaining({ type: action }));
  });

  it('restores the position and balance when confirmation fails', async () => {
    mockWaitForRelayerTransaction.mockRejectedValueOnce(new Error('settlement failed'));

    const redemption = await redeemPosition(createPosition());

    await redemption.followUp;
    expect(positionUpdate.discard).toHaveBeenCalledOnce();
    expect(balanceUpdate.discard).toHaveBeenCalledOnce();
    expect(balanceUpdate.finalize).not.toHaveBeenCalled();
    expect(refetchPolymarketStores).toHaveBeenCalledWith(proxyWallet);
    expect(mockAnalyticsTrack).toHaveBeenCalledWith(
      'predictions.redeem_position_failed',
      expect.objectContaining({ errorMessage: 'settlement failed', type: 'claim' })
    );
  });

  it('releases the pending balance when submission is rejected', async () => {
    mockWallet.execute.mockRejectedValueOnce(new Error('submission rejected'));

    await expect(redeemPosition(createPosition())).rejects.toThrow('submission rejected');

    expect(balanceUpdate.discard).toHaveBeenCalledOnce();
    expect(balanceUpdate.apply).not.toHaveBeenCalled();
    expect(polymarketPositionsActions.remove).not.toHaveBeenCalled();
    expect(mockWaitForRelayerTransaction).not.toHaveBeenCalled();
  });
});

function createPosition(overrides: Partial<Parameters<typeof redeemPosition>[0]> = {}): Parameters<typeof redeemPosition>[0] {
  return createPositionFixture({
    asset: '101',
    conditionId: '0x0000000000000000000000000000000000000000000000000000000000000001',
    currentValue: 10,
    eventSlug: 'event',
    negativeRisk: false,
    outcome: 'Yes',
    proxyWallet,
    redeemable: true,
    size: 10,
    slug: 'market',
    ...overrides,
  });
}
