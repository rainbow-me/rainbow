import { type SectionListData } from 'react-native';

import { format } from 'date-fns';
import { capitalize, groupBy } from 'lodash';

import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import * as i18n from '@/languages';
import { type Contact } from '@/redux/contacts';

import { thisMonthTimestamp, thisYearTimestamp, todayTimestamp, yesterdayTimestamp } from './transactions';

export type RainbowTransactionWithContact = RainbowTransaction & {
  contact: Contact | null;
};

export type TransactionSection = {
  title: string;
  data: RainbowTransactionWithContact[];
};

export type TransactionSectionsResult = {
  sections: SectionListData<RainbowTransactionWithContact, TransactionSection>[];
};

const EMPTY_TRANSACTION_SECTIONS: TransactionSectionsResult = Object.freeze({ sections: [] });

function pendingSectionTitle(): string {
  return i18n.t(i18n.l.transactions.pending_title);
}

function droppedSectionTitle(): string {
  return i18n.t(i18n.l.transactions.dropped_title);
}

function readTransactionSectionTitle(transaction: Pick<RainbowTransaction, 'minedAt' | 'status' | 'timestamp'>): string {
  if (transaction.status === TransactionStatus.pending) return pendingSectionTitle();

  const timestampMs = readTransactionTimestampMs(transaction);
  if (timestampMs === null) return droppedSectionTitle();

  if (timestampMs > todayTimestamp) return i18n.t(i18n.l.time.today_caps);
  if (timestampMs > yesterdayTimestamp) return i18n.t(i18n.l.time.yesterday_caps);
  if (timestampMs > thisMonthTimestamp) return i18n.t(i18n.l.time.this_month_caps);

  try {
    return capitalize(
      format(timestampMs, `MMMM${timestampMs > thisYearTimestamp ? '' : ' yyyy'}`, {
        locale: i18n.getDateFnsLocale(),
      })
    );
  } catch {
    return droppedSectionTitle();
  }
}

function readTransactionTimestampMs(transaction: Pick<RainbowTransaction, 'minedAt' | 'timestamp'>): number | null {
  if (typeof transaction.minedAt === 'number') return transaction.minedAt * 1000;
  if (typeof transaction.timestamp === 'number') return transaction.timestamp;
  return null;
}

function addContact(contacts: { [address: string]: Contact }, transaction: RainbowTransaction): RainbowTransactionWithContact {
  const { from, status, to, type } = transaction;
  const isSent = type === 'send' && status === TransactionStatus.confirmed;
  const contactAddress = (isSent ? to : from) || '';

  return {
    ...transaction,
    contact: contacts[contactAddress.toLowerCase()] ?? null,
  };
}

function buildSectionTransaction(transaction: RainbowTransactionWithContact): RainbowTransactionWithContact {
  return {
    ...transaction,
    from: transaction.from || '',
    to: transaction.to || '',
  };
}

function movePendingSectionFirst(
  sections: SectionListData<RainbowTransactionWithContact, TransactionSection>[]
): SectionListData<RainbowTransactionWithContact, TransactionSection>[] {
  const pendingIndex = sections.findIndex(section => section.title === pendingSectionTitle());
  if (pendingIndex <= 0) return sections;

  const nextSections = [...sections];
  const [pendingSection] = nextSections.splice(pendingIndex, 1);
  nextSections.unshift(pendingSection);
  return nextSections;
}

export const buildTransactionsSections = ({
  contacts,
  transactions,
}: {
  contacts: { [address: string]: Contact };
  transactions: RainbowTransaction[];
}): TransactionSectionsResult => {
  if (!transactions.length) return EMPTY_TRANSACTION_SECTIONS;

  const transactionsBySection = groupBy(
    transactions.map(transaction => addContact(contacts, transaction)),
    readTransactionSectionTitle
  );
  const sections = Object.entries(transactionsBySection)
    .filter(([title]) => title !== droppedSectionTitle())
    .map(([title, sectionTransactions]) => ({
      data: sectionTransactions.map(buildSectionTransaction),
      title,
    }));

  return {
    sections: movePendingSectionFirst(sections),
  };
};
