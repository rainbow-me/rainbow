import { OrderStatus, RampCryptoAsset, RampNetwork, type BuyOrder } from '../services/rampClient';
import { buildCashPurchaseTransaction } from './buildCashPurchaseTransaction';

jest.mock('@/utils/getUrlForTrustIconFallback', () => jest.fn(() => undefined));

jest.mock('../services/rampClient', () => ({
  OrderStatus: { Completed: 'ORDER_STATUS_COMPLETED' },
  RampCryptoAsset: { USDC: 'CRYPTO_ASSET_USDC' },
  RampError: class RampError extends Error {},
  RampNetwork: { ArbitrumTestnet: 'NETWORK_ARBITRUM_TESTNET', Base: 'NETWORK_BASE' },
}));

it('normalizes the transaction hash for Activity deduplication', () => {
  const order: Extract<BuyOrder, { status: OrderStatus.Completed }> = {
    id: 'order-1',
    status: OrderStatus.Completed,
    cryptoAmount: { amount: '50', asset: { asset: RampCryptoAsset.USDC, network: RampNetwork.Base } },
    fiatAmount: { amount: '50', currency: 'USD' },
    createdTime: '2026-06-24T18:31:25.000Z',
    completedTime: '2026-06-24T18:31:31.000Z',
    transactionHash: '0xAbCdEf123456',
    walletAddress: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  };

  const transaction = buildCashPurchaseTransaction({ order, walletAddress: order.walletAddress });

  expect(transaction.hash).toBe('0xabcdef123456');
});
