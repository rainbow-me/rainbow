import { OrderStatus, RampCryptoAsset, RampNetwork, type BuyOrder } from '../services/rampClient';
import { buildCashPurchaseTransaction } from './buildCashPurchaseTransaction';

jest.mock('@/utils/ethereumUtils', () => ({ getUniqueId: (address: string, chainId: number) => `${address}_${chainId}` }));
jest.mock('@/utils/getUrlForTrustIconFallback', () => ({ __esModule: true, default: () => 'icon-url' }));

const WALLET_ADDRESS = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const COMPLETED_ORDER: Extract<BuyOrder, { status: OrderStatus.Completed }> = {
  id: 'order-1',
  status: OrderStatus.Completed,
  cryptoAmount: { amount: '50', asset: { asset: RampCryptoAsset.USDC, network: RampNetwork.Base } },
  fiatAmount: { amount: '50', currency: 'USD' },
  createdTime: '2026-06-24T18:31:25.000Z',
  completedTime: '2026-06-24T18:31:31.000Z',
  transactionHash: '0xtx',
  walletAddress: WALLET_ADDRESS.toLowerCase(),
};

describe('buildCashPurchaseTransaction', () => {
  afterEach(() => jest.restoreAllMocks());

  it('timestamps an immediately completed purchase before history indexing', () => {
    const now = 1750789891000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const transaction = buildCashPurchaseTransaction({ order: COMPLETED_ORDER, walletAddress: WALLET_ADDRESS });

    expect(transaction).toMatchObject({
      hash: COMPLETED_ORDER.transactionHash,
      status: 'pending',
      timestamp: now,
      type: 'purchase',
    });
  });
});
