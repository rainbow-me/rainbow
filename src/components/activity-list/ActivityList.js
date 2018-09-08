import PropTypes from 'prop-types';
import React from 'react';
import { buildTransactionsSections } from '../../helpers/transactions';
import { CoinRow, TransactionCoinRow } from '../coin-row';
import { SectionList } from '../list';
import ActivityListHeader from './ActivityListHeader';

const getItemLayout = (data, index) => ({
  index,
  length: CoinRow.height,
  offset: CoinRow.height * index,
});

const ActivityList = ({
  accountAddress,
  fetchingTransactions,
  hasPendingTransaction,
  onPressBack,
  safeAreaInset,
  transactions,
}) => (
  <SectionList
    contentContainerStyle={{ paddingBottom: 40 }}
    getItemLayout={getItemLayout}
    initialNumToRender={50}
    keyExtractor={({ hash }) => hash}
    removeClippedSubviews
    renderSectionHeader={({ section }) => <ActivityListHeader {...section} />}
    sections={buildTransactionsSections({
      accountAddress,
      renderItem: TransactionCoinRow,
      transactions,
    })}
  />
);

ActivityList.propTypes = {
  accountAddress: PropTypes.string,
  hasPendingTransaction: PropTypes.bool,
  transactions: PropTypes.array,
};

export default ActivityList;
