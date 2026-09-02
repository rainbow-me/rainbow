import { OrderStatus, RampError, RampNetwork, type BuyOrder } from '../services/rampClient';
import { buildCashPurchaseTransaction } from './buildCashPurchaseTransaction';

jest.mock('@/utils/ethereumUtils', () => ({ getUniqueId: jest.fn(() => 'usdc-base') }));
jest.mock('@/utils/getUrlForTrustIconFallback', () => jest.fn(() => null));

type CompletedBuyOrder = Extract<BuyOrder, { status: OrderStatus.Completed }>;

const WALLET_ADDRESS = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const ORDER = {
  id: 'order-1',
  status: OrderStatus.Completed,
  cryptoAmount: { amount: '50', asset: { network: RampNetwork.Base } },
  fiatAmount: { amount: '50', currency: 'USD' },
  transactionHash: '0xtx',
} satisfies CompletedBuyOrder;

describe('buildCashPurchaseTransaction', () => {
  // The amount's format and the network are settled at the ramp boundary; what can still be absent here
  // is a field the backend simply did not populate.
  const invalidOrders: { label: string; order: CompletedBuyOrder }[] = [
    { label: 'no crypto amount', order: { ...ORDER, cryptoAmount: undefined } },
    { label: 'no transaction hash', order: { ...ORDER, transactionHash: undefined } },
    { label: 'an empty transaction hash', order: { ...ORDER, transactionHash: '' } },
  ];

  it.each(invalidOrders)('rejects $label before building an Activity entry', ({ order }) => {
    expect(() => buildCashPurchaseTransaction({ order, walletAddress: WALLET_ADDRESS })).toThrow(RampError);
  });

  it('passes the amount through untouched and omits the description when there is no fiat amount', () => {
    const order = { ...ORDER, cryptoAmount: { ...ORDER.cryptoAmount, amount: '1e-3' }, fiatAmount: undefined };

    const transaction = buildCashPurchaseTransaction({ order, walletAddress: WALLET_ADDRESS });

    expect(transaction.amount).toBe('1e-3');
    expect(transaction.description).toBeUndefined();
  });

  it('normalizes the transaction hash for Activity deduplication', () => {
    const order = { ...ORDER, transactionHash: '0xAbCdEf123456' };

    const transaction = buildCashPurchaseTransaction({ order, walletAddress: WALLET_ADDRESS });

    expect(transaction.hash).toBe('0xabcdef123456');
  });
});
