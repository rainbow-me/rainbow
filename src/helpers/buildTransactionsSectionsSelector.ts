import { format } from 'date-fns';
import { groupBy, isEmpty } from 'lodash';
import { createElement } from 'react';
import { createSelector } from 'reselect';
import { RequestCoinRow, TransactionCoinRow } from '../components/coin-row';
import {
  thisMonthTimestamp,
  thisYearTimestamp,
  todayTimestamp,
  yesterdayTimestamp,
} from './transactions';
import { TransactionStatusTypes } from '@rainbow-me/entities';

const contactsSelector = (state: any) => state.contacts;
const requestsSelector = (state: any) => state.requests;
const transactionsSelector = (state: any) => state.transactions;
const focusedSelector = (state: any) => state.isFocused;
const initializedSelector = (state: any) => state.initialized;

const renderItemElement = (renderItem: any) =>
  function InternarSectionListRender(renderItemProps: any) {
    return createElement(renderItem, renderItemProps);
  };
const groupTransactionByDate = ({ pending, minedAt }: any) => {
  if (pending) return 'Pending';

  const ts = parseInt(minedAt, 10) * 1000;

  if (ts > todayTimestamp) return 'Today';
  if (ts > yesterdayTimestamp) return 'Yesterday';
  if (ts > thisMonthTimestamp) return 'This Month';

  return format(ts, `MMMM${ts > thisYearTimestamp ? '' : ' yyyy'}`);
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
  contacts: any,
  requests: any,
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
    sectionedTransactions = Object.keys(transactionsByDate).map(section => ({
      data: transactionsByDate[section],
      renderItem: renderItemElement(TransactionCoinRow),
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
        renderItem: renderItemElement(RequestCoinRow),
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
    contactsSelector,
    requestsSelector,
    transactionsSelector,
    focusedSelector,
    initializedSelector,
  ],
  buildTransactionsSections
);
