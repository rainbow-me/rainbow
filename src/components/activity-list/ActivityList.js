import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { buildTransactionsSections } from '../../helpers/transactions';
import { CoinRow, TransactionCoinRow, RequestCoinRow } from '../coin-row';
import { SectionList } from '../list';
import ActivityListHeader from './ActivityListHeader';

const getItemLayout = (data, index) => ({
  index,
  length: CoinRow.height,
  offset: CoinRow.height * index,
});

const keyExtractor = ({ hash, transactionId }) => (hash || transactionId);
const renderSectionHeader = ({ section }) => <ActivityListHeader {...section} />;

const ActivityList = ({
  accountAddress,
  hasPendingTransaction,
  requests,
  transactions,
  transactionsCount,
}) => (
  <SectionList
    contentContainerStyle={{ paddingBottom: 40 }}
    extraData={{ hasPendingTransaction }}
    getItemLayout={getItemLayout}
    initialNumToRender={Math.min(transactionsCount, 30)}
    keyExtractor={keyExtractor}
    maxToRenderPerBatch={40}
    removeClippedSubviews
    renderSectionHeader={renderSectionHeader}
    sections={buildTransactionsSections({
      accountAddress,
      requests,
      transactions,
      requestRenderItem: RequestCoinRow,
      transactionRenderItem: TransactionCoinRow,
    })}
  />
);

ActivityList.propTypes = {
  accountAddress: PropTypes.string,
  hasPendingTransaction: PropTypes.bool,
  requests: PropTypes.array,
  transactions: PropTypes.array,
  transactionsCount: PropTypes.number,
};

export default onlyUpdateForKeys(['hasPendingTransaction', 'requests', 'transactionsCount'])(ActivityList);
