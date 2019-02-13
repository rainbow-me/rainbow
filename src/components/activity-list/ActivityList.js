import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withProps,
} from 'recompact';
import ActivityListHeader from './ActivityListHeader';
import { CoinRow } from '../coin-row';
import { RecyclerSectionList } from '../list';
import { buildTransactionsSectionsSelector } from '../../helpers/transactions';
import {
  withAccountAddress,
  withAccountSettings,
  withAccountTransactions,
} from '../../hoc';

const getItemLayout = (data, index) => ({
  index,
  length: CoinRow.height,
  offset: CoinRow.height * index,
});

const keyExtractor = ({ hash, timestamp, transactionDisplayDetails }) => (hash || (timestamp ? timestamp.ms : transactionDisplayDetails.timestampInMs));
// const keyExtractor = ({ hash, timestamp: { ms } }) => (hash || ms);

// eslint-disable-next-line react/prop-types

const ActivityList = ({
  hasPendingTransaction,
  header,
  nativeCurrency,
  pendingTransactionsCount,
  sections,
  transactionsCount,
}) => (
  <RecyclerSectionList
    sections={sections}
    ListHeaderComponent={header}
  />
);

ActivityList.propTypes = {
  hasPendingTransaction: PropTypes.bool,
  header: PropTypes.node,
  nativeCurrency: PropTypes.string.isRequired,
  pendingTransactionsCount: PropTypes.number,
  sections: PropTypes.arrayOf(PropTypes.shape({
    data: PropTypes.array,
    renderItem: PropTypes.func,
    title: PropTypes.string.isRequired,
  })),
  transactionsCount: PropTypes.number,
};

export default compose(
  withAccountAddress,
  withAccountSettings,
  withAccountTransactions,
  withProps(buildTransactionsSectionsSelector),
  mapProps(({
    nativeCurrency,
    requests,
    sections,
    ...props
  }) => {
    console.log(sections)
    let pendingTransactionsCount = 0;

    const pendingTxSection = sections[requests.length ? 1 : 0];

    if (pendingTxSection && pendingTxSection.title === 'Pending') {
      pendingTransactionsCount = pendingTxSection.data.length;
    }

    return {
      ...props,
      nativeCurrency,
      pendingTransactionsCount,
      sections,
    };
  }),
  onlyUpdateForKeys([
    'hasPendingTransaction',
    'nativeCurrency',
    'pendingTransactionsCount',
    'sections',
    'transactionsCount',
  ]),
)(ActivityList);
