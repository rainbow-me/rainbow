import PropTypes from 'prop-types';
import React from 'react';
import { compose, mapProps, onlyUpdateForKeys } from 'recompact';
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
  hasPendingTransaction,
  pendingTransactionsCount,
  sections,
  transactionsCount,
}) => (
  <SectionList
    contentContainerStyle={{ paddingBottom: 40 }}
    extraData={{ hasPendingTransaction, pendingTransactionsCount }}
    getItemLayout={getItemLayout}
    initialNumToRender={(transactionsCount < 30) ? transactionsCount : 30}
    keyExtractor={keyExtractor}
    maxToRenderPerBatch={40}
    renderSectionHeader={renderSectionHeader}
    sections={sections}
  />
);

ActivityList.propTypes = {
  hasPendingTransaction: PropTypes.bool,
  pendingTransactionsCount: PropTypes.number,
  sections: PropTypes.arrayOf(PropTypes.shape({
    data: PropTypes.array,
    renderItem: PropTypes.func,
    title: PropTypes.string.isRequired,
  })),
  transactionsCount: PropTypes.number,
};

export default compose(
  mapProps(({
    accountAddress,
    requests,
    transactions,
    ...props
  }) => {
    let pendingTransactionsCount = 0;

    const sections = buildTransactionsSections({
      accountAddress,
      requestRenderItem: RequestCoinRow,
      requests,
      transactionRenderItem: TransactionCoinRow,
      transactions,
    });

    const pendingTransactionsSection = sections[requests.length ? 1 : 0];
    if (pendingTransactionsSection && pendingTransactionsSection.title === 'Pending') {
      pendingTransactionsCount = pendingTransactionsSection.data.length;
    }

    return {
      ...props,
      pendingTransactionsCount,
      sections,
    };
  }),
  onlyUpdateForKeys([
    'hasPendingTransaction',
    'pendingTransactionsCount',
    'sections',
    'transactionsCount',
  ]),
)(ActivityList);
