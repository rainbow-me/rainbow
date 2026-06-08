import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import * as i18n from '@/languages';

import { buildTransactionsSections } from './buildTransactionsSections';
import { thisMonthTimestamp, todayTimestamp } from './transactions';

jest.mock('./transactions', () => ({
  thisMonthTimestamp: Date.UTC(2026, 4, 1),
  thisYearTimestamp: Date.UTC(2026, 0, 1),
  todayTimestamp: Date.UTC(2026, 4, 29),
  yesterdayTimestamp: Date.UTC(2026, 4, 28),
}));

describe('buildTransactionsSections', () => {
  it('keeps confirmed local overlays visible before minedAt exists', () => {
    const transaction = buildTransaction({
      status: TransactionStatus.confirmed,
      timestamp: todayTimestamp + 1000,
      title: 'swap.confirmed',
    });

    const sections = buildTransactionsSections({
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

    const sections = buildTransactionsSections({
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

  it('orders time sections independently from transaction input order', () => {
    const thisMonthTransaction = buildTransaction({
      hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      status: TransactionStatus.confirmed,
      timestamp: thisMonthTimestamp + 1000,
      title: 'swap.confirmed',
    });
    const todayTransaction = buildTransaction({
      hash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      status: TransactionStatus.confirmed,
      timestamp: todayTimestamp + 1000,
      title: 'swap.confirmed',
    });

    const sections = buildTransactionsSections({
      contacts: {},
      transactions: [thisMonthTransaction, todayTransaction],
    });

    expect(sections.map(section => section.title)).toEqual([i18n.t(i18n.l.time.today_caps), i18n.t(i18n.l.time.this_month_caps)]);
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
