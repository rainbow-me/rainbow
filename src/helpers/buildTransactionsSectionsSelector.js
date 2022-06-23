import { format } from 'date-fns';
import { get, groupBy, isEmpty, map, toLower } from 'lodash';
import React from 'react';
import { createSelector } from 'reselect';
import {
  FastRequestCoinRow,
  FastTransactionCoinRow,
} from '../components/coin-row';
import {
  thisMonthTimestamp,
  thisYearTimestamp,
  todayTimestamp,
  yesterdayTimestamp,
} from './transactions';
import { TransactionStatusTypes } from '@rainbow-me/entities';

const accountAssetsDataSelector = state => state.accountAssetsData;
const accountAddressSelector = state => state.accountAddress;
const contactsSelector = state => state.contacts;
const requestsSelector = state => state.requests;
const themeSelector = state => state.theme;
const transactionsSelector = state => state.transactions;
const focusedSelector = state => state.isFocused;
const initializedSelector = state => state.initialized;
const onTransactionPressSelector = state => state.onTransactionPress;

const groupTransactionByDate = ({ pending, minedAt }) => {
  if (pending) return 'Pending';

  const ts = parseInt(minedAt, 10) * 1000;

  if (ts > todayTimestamp) return 'Today';
  if (ts > yesterdayTimestamp) return 'Yesterday';
  if (ts > thisMonthTimestamp) return 'This Month';

  return format(ts, `MMMM${ts > thisYearTimestamp ? '' : ' yyyy'}`);
};

const addContactInfo = contacts => txn => {
  const { from, to, status } = txn;
  const isSent = status === TransactionStatusTypes.sent;
  const contactAddress = isSent ? to : from;
  const contact = get(contacts, `${[toLower(contactAddress)]}`, null);
  return {
    ...txn,
    contact,
  };
};

const buildTransactionsSections = (
  accountAddress,
  accountAssetsData,
  contacts,
  requests,
  theme,
  transactions,
  isFocused,
  initialized,
  onTransactionPress
) => {
  if (!isFocused && !initialized) {
    return { sections: [] };
  }

  let sectionedTransactions = [];

  const transactionsWithContacts = map(transactions, addContactInfo(contacts));

  if (!isEmpty(transactionsWithContacts)) {
    const transactionsByDate = groupBy(
      transactionsWithContacts,
      groupTransactionByDate
    );
    sectionedTransactions = Object.keys(transactionsByDate).map(section => ({
      data: transactionsByDate[section].map(txn => ({
        ...txn,
        accountAddress,
        mainnetAddress:
          accountAssetsData[`${txn.address}_${txn.network}`]?.mainnet_address,
      })),
      renderItem: ({ item }) => (
        <FastTransactionCoinRow
          item={item}
          onTransactionPress={onTransactionPress}
          theme={theme}
        />
      ),
      title: section,
    }));
    const pendingSectionIndex = sectionedTransactions.findIndex(
      ({ title }) => title === 'Pending'
    );
    if (pendingSectionIndex > 0) {
      const pendingSection = sectionedTransactions.splice(
        pendingSectionIndex,
        1
      );
      sectionedTransactions.unshift(pendingSection[0]);
    }
  }

  let requestsToApprove = [];
  if (!isEmpty(requests)) {
    requestsToApprove = [
      {
        data: requests,
        renderItem: ({ item }) => (
          <FastRequestCoinRow item={item} theme={theme} />
        ),
        title: 'Requests',
      },
    ];
  }
  return {
    sections: [...requestsToApprove, ...sectionedTransactions],
  };
};

export const buildTransactionsSectionsSelector = createSelector(
  [
    accountAddressSelector,
    accountAssetsDataSelector,
    contactsSelector,
    requestsSelector,
    themeSelector,
    transactionsSelector,
    focusedSelector,
    initializedSelector,
    onTransactionPressSelector,
  ],
  buildTransactionsSections
);
