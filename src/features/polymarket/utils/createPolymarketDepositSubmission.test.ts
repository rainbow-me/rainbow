import { Chain, ClobClient } from '@polymarket/clob-client-v2';
import { ethers, Wallet } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { syncClobCollateralBalance } from '@/features/polymarket/utils/syncClobCollateralBalance';

import { createPolymarketDepositSubmission } from './createPolymarketDepositSubmission';

vi.mock('@/features/polymarket/stores/derived/usePolymarketClients', () => ({
  usePolymarketClients: { getState: vi.fn() },
}));

vi.mock('@/features/polymarket/utils/collateral', () => ({
  getPolygonUsdcBalance: vi.fn(),
  wrapUsdcToPusd: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/refetchPolymarketStores', () => ({
  refetchPolymarketBalance: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/syncClobCollateralBalance', () => ({
  syncClobCollateralBalance: vi.fn(),
}));

vi.mock('@/handlers/web3', () => ({
  getProvider: vi.fn(),
}));

const signer = new Wallet('0x0000000000000000000000000000000000000000000000000000000000000001');
const proxyAddress = '0x0000000000000000000000000000000000000002';
const clobClient = new ClobClient({ host: 'https://clob.test', chain: Chain.POLYGON });
const wallet: PolymarketWallet = { address: proxyAddress, execute: vi.fn() };
const getClobClient = vi.fn().mockResolvedValue(clobClient);
const getWallet = vi.fn().mockResolvedValue(wallet);

const mockGetClientsState = vi.mocked(usePolymarketClients.getState);
const mockGetPolygonUsdcBalance = vi.mocked(getPolygonUsdcBalance);
const mockRefetchPolymarketBalance = vi.mocked(refetchPolymarketBalance);
const mockSyncClobCollateralBalance = vi.mocked(syncClobCollateralBalance);
const mockWrapUsdcToPusd = vi.mocked(wrapUsdcToPusd);

describe('createPolymarketDepositSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPolygonUsdcBalance.mockResolvedValueOnce(ethers.constants.Zero).mockResolvedValueOnce(ethers.BigNumber.from(10));
    mockGetClientsState.mockReturnValue({
      getClobClient,
      getWallet,
      proxyAddress,
    });
  });

  it('uses the captured account after the active clients change', async () => {
    const submission = createPolymarketDepositSubmission();
    mockGetClientsState.mockReturnValue({ getWallet: null, getClobClient: null, proxyAddress: null });

    await submission.prepare(signer);
    await submission.onSubmitted({
      confirmationChainId: ChainId.polygon,
      expectedRawTargetAmount: '10',
      isConfirmed: true,
    });

    expect(getWallet).toHaveBeenCalledWith(signer);
    expect(mockWrapUsdcToPusd).toHaveBeenCalledWith({ amount: ethers.BigNumber.from(10), wallet });
    expect(mockSyncClobCollateralBalance).toHaveBeenCalledWith(clobClient);
    expect(mockRefetchPolymarketBalance).toHaveBeenCalledWith(proxyAddress);
  });
});
