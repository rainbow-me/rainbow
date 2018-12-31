import PropTypes from 'prop-types';
import React from 'react';
import { compose, mapProps, onlyUpdateForKeys } from 'recompact';
import { buildTransactionsSections } from '../../helpers/transactions';
import { withAccountSettings } from '../../hoc';
import { CoinRow, TransactionCoinRow, RequestCoinRow } from '../coin-row';
import { SectionList } from '../list';
import ActivityListHeader from './ActivityListHeader';

const getItemLayout = (data, index) => ({
  index,
  length: CoinRow.height,
  offset: CoinRow.height * index,
});

const keyExtractor = ({ hash, timestamp, transactionDisplayDetails }) => (hash || (timestamp ? timestamp.ms : transactionDisplayDetails.timestampInMs));
const renderSectionHeader = ({ section }) => <ActivityListHeader {...section} />;

const ActivityList = ({
  hasPendingTransaction,
  header,
  nativeCurrency,
  pendingTransactionsCount,
  sections,
  transactionsCount,
}) => (
  <SectionList
    contentContainerStyle={{ paddingBottom: 40 }}
    extraData={{
      hasPendingTransaction,
      nativeCurrency,
      pendingTransactionsCount,
    }}
    getItemLayout={getItemLayout}
    initialNumToRender={12}
    keyExtractor={keyExtractor}
    ListHeaderComponent={header}
    removeClippedSubviews={true}
    renderSectionHeader={renderSectionHeader}
    sections={sections}
    windowSize={15.75}
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
  withAccountSettings,
  mapProps(({
    accountAddress,
    nativeCurrency,
    requests,
    transactions,
    ...props
  }) => {
    let pendingTransactionsCount = 0;

    const sections = buildTransactionsSections({
      accountAddress,
      nativeCurrency,
      requestRenderItem: RequestCoinRow,
      requests,
      transactionRenderItem: TransactionCoinRow,
      transactions,
    });

    const pendingTxSection = sections[requests.length ? 1 : 0];

    if (pendingTxSection && pendingTxSection.title === 'Pending') {
      pendingTransactionsCount = pendingTxSection.data.length;
    }

    return {
      ...props,
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
