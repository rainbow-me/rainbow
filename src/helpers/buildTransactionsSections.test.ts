import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import * as i18n from '@/languages';

import { buildTransactionsSections } from './buildTransactionsSections';
import { thisMonthTimestamp, todayTimestamp, yesterdayTimestamp } from './transactions';

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

  it('orders every section rank and keeps transactions in their matching sections', () => {
    const pendingTransaction = buildTransaction({
      hash: hash(1),
      status: TransactionStatus.pending,
      title: 'swap.pending',
    });
    const todayTransaction = buildTransaction({
      hash: hash(2),
      status: TransactionStatus.confirmed,
      timestamp: todayTimestamp + 1000,
      title: 'swap.confirmed',
    });
    const yesterdayTransaction = buildTransaction({
      hash: hash(3),
      status: TransactionStatus.confirmed,
      timestamp: yesterdayTimestamp + 1000,
      title: 'swap.confirmed',
    });
    const thisMonthTransaction = buildTransaction({
      hash: hash(4),
      status: TransactionStatus.confirmed,
      timestamp: thisMonthTimestamp + 1000,
      title: 'swap.confirmed',
    });
    const monthTransaction = buildTransaction({
      hash: hash(5),
      status: TransactionStatus.confirmed,
      timestamp: Date.UTC(2026, 3, 15),
      title: 'swap.confirmed',
    });

    const sections = buildTransactionsSections({
      contacts: {},
      transactions: [monthTransaction, thisMonthTransaction, yesterdayTransaction, todayTransaction, pendingTransaction],
    });

    expect(sectionHashes(sections)).toEqual([
      [i18n.t(i18n.l.transactions.pending_title), [pendingTransaction.hash]],
      [i18n.t(i18n.l.time.today_caps), [todayTransaction.hash]],
      [i18n.t(i18n.l.time.yesterday_caps), [yesterdayTransaction.hash]],
      [i18n.t(i18n.l.time.this_month_caps), [thisMonthTransaction.hash]],
      ['April', [monthTransaction.hash]],
    ]);
  });

  it('sorts section transactions by newest timestamp and fills contact data', () => {
    const contactAddress = '0x1111111111111111111111111111111111111111';
    const contact = {
      address: contactAddress,
      color: 1,
      ens: 'rainbow.eth',
      nickname: 'Rainbow',
    };
    const olderTransaction = buildTransaction({
      hash: hash(6),
      from: null,
      status: TransactionStatus.confirmed,
      timestamp: todayTimestamp + 1000,
      title: 'swap.confirmed',
    });
    const newerTransaction = buildTransaction({
      hash: hash(7),
      from: contactAddress,
      status: TransactionStatus.confirmed,
      timestamp: todayTimestamp + 2000,
      title: 'swap.confirmed',
    });

    const sections = buildTransactionsSections({
      contacts: { [contactAddress]: contact },
      transactions: [olderTransaction, newerTransaction],
    });

    expect(sections).toEqual([
      expect.objectContaining({
        title: i18n.t(i18n.l.time.today_caps),
        data: [
          expect.objectContaining({ contact, from: contactAddress, hash: newerTransaction.hash }),
          expect.objectContaining({ contact: null, from: '', hash: olderTransaction.hash }),
        ],
      }),
    ]);
  });

  it('drops non-pending transactions without a sortable timestamp', () => {
    const droppedTransaction = buildTransaction({
      hash: hash(8),
      minedAt: null,
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    });
    const visibleTransaction = buildTransaction({
      hash: hash(9),
      status: TransactionStatus.confirmed,
      timestamp: todayTimestamp + 1000,
      title: 'swap.confirmed',
    });

    const sections = buildTransactionsSections({
      contacts: {},
      transactions: [droppedTransaction, visibleTransaction],
    });

    expect(sectionHashes(sections)).toEqual([[i18n.t(i18n.l.time.today_caps), [visibleTransaction.hash]]]);
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

function hash(value: number): string {
  return `0x${value.toString(16).padStart(64, '0')}`;
}

function sectionHashes(sections: ReturnType<typeof buildTransactionsSections>): [string, string[]][] {
  return sections.map(section => [section.title, section.data.map(transaction => transaction.hash)]);
}
