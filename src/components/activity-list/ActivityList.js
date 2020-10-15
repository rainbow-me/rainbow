import React from 'react';
import { SectionList } from 'react-native';
import { mapProps } from 'recompact';
import networkTypes from '../../helpers/networkTypes';
import { CoinRowHeight } from '../coin-row';
import ActivityListEmptyState from './ActivityListEmptyState';
import ActivityListHeader from './ActivityListHeader';
import RecyclerActivityList from './RecyclerActivityList';

const getItemLayout = (data, index) => ({
  index,
  length: CoinRowHeight,
  offset: CoinRowHeight * index,
});

const keyExtractor = ({ hash, timestamp, transactionDisplayDetails }) =>
  hash || (timestamp ? timestamp.ms : transactionDisplayDetails.timestampInMs);

const renderSectionHeader = ({ section }) => (
  <ActivityListHeader {...section} />
);

const ActivityList = ({
  hasPendingTransaction,
  header,
  nativeCurrency,
  pendingTransactionsCount,
  sections,
  transactionsCount,
  addCashAvailable,
  isEmpty,
  isLoading,
  navigation,
  network,
  recyclerListView,
}) => {
  return network === networkTypes.mainnet || sections.length ? (
    recyclerListView ? (
      <RecyclerActivityList
        addCashAvailable={addCashAvailable}
        header={header}
        isEmpty={isEmpty}
        isLoading={isLoading}
        navigation={navigation}
        sections={sections}
      />
    ) : (
      <SectionList
        ListHeaderComponent={header}
        alwaysBounceVertical={false}
        contentContainerStyle={{ paddingBottom: !transactionsCount ? 0 : 40 }}
        extraData={{
          hasPendingTransaction,
          nativeCurrency,
          pendingTransactionsCount,
        }}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        keyExtractor={keyExtractor}
        removeClippedSubviews
        renderSectionHeader={renderSectionHeader}
        sections={sections}
        windowSize={50}
      />
    )
  ) : (
    <ActivityListEmptyState
      emoji="👻"
      label="Your testnet transaction history starts now!"
    >
      {header}
    </ActivityListEmptyState>
  );
};

export default mapProps(({ nativeCurrency, requests, sections, ...props }) => {
  let pendingTransactionsCount = 0;
  const pendingTxSection = sections[requests?.length ? 1 : 0];

  if (pendingTxSection && pendingTxSection.title === 'Pending') {
    pendingTransactionsCount = pendingTxSection.data.length;
  }

  return {
    ...props,
    nativeCurrency,
    pendingTransactionsCount,
    sections,
  };
})(ActivityList);
