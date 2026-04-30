import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import * as i18n from '@/languages';

import { buildTransactionsSections } from './buildTransactionsSectionsSelector';
import { todayTimestamp } from './transactions';

describe('buildTransactionsSections', () => {
  it('keeps confirmed local overlays visible before minedAt exists', () => {
    const transaction = buildTransaction({
      status: TransactionStatus.confirmed,
      timestamp: todayTimestamp + 1000,
      title: 'swap.confirmed',
    });

    const { sections } = buildTransactionsSections({
      contacts: {},
      transactions: [transaction],
    });

    expect(sections).toEqual([
      expect.objectContaining({
        title: i18n.t(i18n.l.time.today_caps),
        data: [expect.objectContaining({ hash: transaction.hash })],
      }),
    ]);
  });

  it('keeps pending transactions in the pending section', () => {
    const transaction = buildTransaction({
      status: TransactionStatus.pending,
      timestamp: todayTimestamp + 1000,
      title: 'swap.pending',
    });

    const { sections } = buildTransactionsSections({
      contacts: {},
      transactions: [transaction],
    });

    expect(sections).toEqual([
      expect.objectContaining({
        title: i18n.t(i18n.l.transactions.pending_title),
        data: [expect.objectContaining({ hash: transaction.hash })],
      }),
    ]);
  });
});

function buildTransaction(overrides: Partial<RainbowTransaction>): RainbowTransaction {
  return {
    chainId: 8453,
    from: '0x1111111111111111111111111111111111111111',
    hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    network: 'Base',
    status: TransactionStatus.pending,
    title: 'swap.pending',
    to: '0x2222222222222222222222222222222222222222',
    type: 'swap',
    ...overrides,
  };
}
