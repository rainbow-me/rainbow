import { format } from 'date-fns';
import { capitalize, groupBy, isEmpty } from 'lodash';
import React from 'react';
import { FastTransactionCoinRow, RequestCoinRow } from '../components/coin-row';
import { thisMonthTimestamp, thisYearTimestamp, todayTimestamp, yesterdayTimestamp } from './transactions';
import { NativeCurrencyKey, RainbowTransaction, TransactionStatus } from '@/entities';
import * as i18n from '@/languages';
import { WalletconnectRequestData } from '@/walletConnect/types';
import { ThemeContextProps } from '@/theme';
import { Contact } from '@/redux/contacts';
import { SectionListData } from 'react-native';

export type RainbowTransactionWithContact = RainbowTransaction & {
  contact: Contact | null;
};

type Section<T> = {
  title: string;
  data: T[];
  renderItem: ({ item }: { item: T }) => JSX.Element;
};

export type WalletconnectSection = Section<WalletconnectRequestData>;
export type TransactionSection = Section<RainbowTransactionWithContact>;

export type TransactionSections = WalletconnectSection | TransactionSection;

export type TransactionItemForSectionList = WalletconnectRequestData | RainbowTransactionWithContact;

export type TransactionSectionsResult = {
  sections: SectionListData<TransactionItemForSectionList, TransactionSections>[];
};

// bad news
const groupTransactionByDate = ({ status, minedAt }: { status: TransactionStatus; minedAt: string }) => {
  if (status === TransactionStatus.pending) {
    return i18n.t(i18n.l.transactions.pending_title);
  }

  const ts = parseInt(minedAt, 10) * 1000;

  if (ts > todayTimestamp) return i18n.t(i18n.l.time.today_caps);
  if (ts > yesterdayTimestamp) return i18n.t(i18n.l.time.yesterday_caps);
  if (ts > thisMonthTimestamp) return i18n.t(i18n.l.time.this_month_caps);
  try {
    return capitalize(
      format(ts, `MMMM${ts > thisYearTimestamp ? '' : ' yyyy'}`, {
        locale: i18n.getDateFnsLocale(),
      })
    );
  } catch (e) {
    return i18n.t(i18n.l.transactions.dropped_title);
  }
};

const addContactInfo =
  (contacts: { [address: string]: Contact }) =>
  (
    txn: RainbowTransaction
  ): RainbowTransaction & {
    contact: Contact | null;
  } => {
    const { from, to, status } = txn;
    const isSent = status === TransactionStatus.sent;
    const contactAddress = (isSent ? to : from) || '';
    const contact = contacts?.[contactAddress?.toLowerCase()] ?? null;
    return {
      ...txn,
      contact,
    };
  };

export const buildTransactionsSections = ({
  accountAddress,
  contacts,
  requests,
  theme,
  transactions,
  nativeCurrency,
}: {
  accountAddress: string;
  contacts: { [address: string]: Contact };
  requests: WalletconnectRequestData[];
  theme: ThemeContextProps;
  transactions: RainbowTransaction[];
  nativeCurrency: NativeCurrencyKey;
}): TransactionSectionsResult => {
  if (!transactions) {
    return { sections: [] };
  }

  let sectionedTransactions: TransactionSections[] = [];

  const transactionsWithContacts = transactions?.map(addContactInfo(contacts));

  if (!isEmpty(transactionsWithContacts)) {
    const transactionsByDate = groupBy(transactionsWithContacts, groupTransactionByDate);

    const test = Object.keys(transactionsByDate);
    const filter = test.filter(key => key !== 'Dropped');
    const sectioned: TransactionSection[] = filter.map((section: string) => {
      const sectionData: RainbowTransactionWithContact[] = transactionsByDate[section].map(txn => {
        const typeTxn = txn as RainbowTransactionWithContact;
        const res = {
          ...typeTxn,
          to: typeTxn.to || '',
          from: typeTxn.from || '',
          accountAddress,
        };

        return res;
      });

      return {
        data: sectionData,
        renderItem: ({ item }: { item: RainbowTransactionWithContact }) => (
          <FastTransactionCoinRow item={item} theme={theme} nativeCurrency={nativeCurrency} />
        ),
        title: section,
      };
    });
    sectionedTransactions = sectioned;

    const pendingSectionIndex = sectionedTransactions.findIndex(({ title }) => title === 'Pending');
    if (pendingSectionIndex > 0) {
      const pendingSection = sectionedTransactions.splice(pendingSectionIndex, 1);
      sectionedTransactions.unshift(pendingSection[0]);
    }
  }

  if (!isEmpty(requests)) {
    sectionedTransactions.unshift({
      data: requests,
      renderItem: ({ item }: { item: WalletconnectRequestData }) => <RequestCoinRow item={item} theme={theme} />,
      title: i18n.t(i18n.l.walletconnect.requests),
    });
  }
  return {
    sections: sectionedTransactions as SectionListData<TransactionItemForSectionList, TransactionSections>[],
  };
};
