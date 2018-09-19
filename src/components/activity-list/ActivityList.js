import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { buildTransactionsSections } from '../../helpers/transactions';
import { CoinRow, TransactionCoinRow } from '../coin-row';
import { SectionList } from '../list';
import ActivityListHeader from './ActivityListHeader';

const getItemLayout = (data, index) => ({
  index,
  length: CoinRow.height,
  offset: CoinRow.height * index,
});

const keyExtractor = ({ hash }) => hash;
const renderSectionHeader = ({ section }) => <ActivityListHeader {...section} />;

const ActivityList = ({
  accountAddress,
  hasPendingTransaction,
  transactions,
}) => (
  <SectionList
    contentContainerStyle={{ paddingBottom: 40 }}
    extraData={{ hasPendingTransaction }}
    getItemLayout={getItemLayout}
    initialNumToRender={30}
    keyExtractor={keyExtractor}
    maxToRenderPerBatch={40}
    removeClippedSubviews
    renderSectionHeader={renderSectionHeader}
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
  transactionsCount: PropTypes.number,
};

export default onlyUpdateForKeys(['hasPendingTransaction', 'transactionsCount'])(ActivityList);
