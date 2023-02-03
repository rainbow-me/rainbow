import { format } from 'date-fns';
import { groupBy, isEmpty } from 'lodash';
import React from 'react';
import { createSelector } from 'reselect';
import { FastTransactionCoinRow, RequestCoinRow } from '../components/coin-row';
import {
  thisMonthTimestamp,
  thisYearTimestamp,
  todayTimestamp,
  yesterdayTimestamp,
} from './transactions';
import { TransactionStatusTypes } from '@/entities';

const mainnetAddressesSelector = (state: any) => state.mainnetAddresses;
const accountAddressSelector = (state: any) => state.accountAddress;
const contactsSelector = (state: any) => state.contacts;
const requestsSelector = (state: any) => state.requests;
const themeSelector = (state: any) => state.theme;
const transactionsSelector = (state: any) => state.transactions;
const focusedSelector = (state: any) => state.isFocused;
const initializedSelector = (state: any) => state.initialized;
const navigateSelector = (state: any) => state.navigate;

const groupTransactionByDate = ({ pending, minedAt }: any) => {
  if (pending) return 'Pending';

  const ts = parseInt(minedAt, 10) * 1000;

  if (ts > todayTimestamp) return 'Today';
  if (ts > yesterdayTimestamp) return 'Yesterday';
  if (ts > thisMonthTimestamp) return 'This Month';
  try {
    return format(ts, `MMMM${ts > thisYearTimestamp ? '' : ' yyyy'}`);
  } catch (e) {
    return 'Dropped';
  }
};

const addContactInfo = (contacts: any) => (txn: any) => {
  const { from, to, status } = txn;
  const isSent = status === TransactionStatusTypes.sent;
  const contactAddress = isSent ? to : from;
  const contact = contacts?.[contactAddress?.toLowerCase()] ?? null;
  return {
    ...txn,
    contact,
  };
};

const buildTransactionsSections = (
  accountAddress: any,
  mainnetAddresses: any,
  contacts: any,
  requests: any,
  theme: any,
  transactions: any,
  isFocused: any,
  initialized: any
) => {
  if (!isFocused && !initialized) {
    return { sections: [] };
  }

  let sectionedTransactions: any = [];

  const transactionsWithContacts = transactions?.map(addContactInfo(contacts));

  if (!isEmpty(transactionsWithContacts)) {
    const transactionsByDate = groupBy(
      transactionsWithContacts,
      groupTransactionByDate
    );

    sectionedTransactions = Object.keys(transactionsByDate)
      .filter(section => section !== 'Dropped')
      .map(section => ({
        data: transactionsByDate[section].map(txn => ({
          ...txn,
          accountAddress,
          mainnetAddress: mainnetAddresses[`${txn.address}_${txn.network}`],
        })),
        renderItem: ({ item }: any) => (
          <FastTransactionCoinRow item={item} theme={theme} />
        ),
        title: section,
      }));

    const pendingSectionIndex = sectionedTransactions.findIndex(
      // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'title' implicitly has an 'any' ty... Remove this comment to see the full error message
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

  let requestsToApprove: any = [];
  if (!isEmpty(requests)) {
    requestsToApprove = [
      {
        data: requests,
        renderItem: ({ item }: any) => (
          <RequestCoinRow item={item} theme={theme} />
        ),
        title: 'Requests',
      },
    ];
  }
  return {
    sections: requestsToApprove.concat(sectionedTransactions),
  };
};

export const buildTransactionsSectionsSelector = createSelector(
  [
    accountAddressSelector,
    mainnetAddressesSelector,
    contactsSelector,
    requestsSelector,
    themeSelector,
    transactionsSelector,
    focusedSelector,
    initializedSelector,
    navigateSelector,
  ],
  buildTransactionsSections
);
