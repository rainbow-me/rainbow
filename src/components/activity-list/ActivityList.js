import React, { useEffect, useState } from 'react';
import { SectionList } from 'react-native';
import { mapProps } from 'recompact';
import styled from 'styled-components/primitives';
import networkTypes from '../../helpers/networkTypes';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { CoinRowHeight } from '../coin-row';
import Text from '../text/Text';
import ActivityListEmptyState from './ActivityListEmptyState';
import ActivityListHeader from './ActivityListHeader';
import RecyclerActivityList from './RecyclerActivityList';
import { colors } from '@rainbow-me/styles';

const getItemLayout = (data, index) => ({
  index,
  length: CoinRowHeight,
  offset: CoinRowHeight * index,
});

const keyExtractor = ({ hash, timestamp, transactionDisplayDetails }) =>
  hash ||
  (timestamp ? timestamp.ms : transactionDisplayDetails?.timestampInMs || 0);

const renderSectionHeader = ({ section }) => (
  <ActivityListHeader {...section} />
);

const LoadingSpinner = android ? Spinner : ActivityIndicator;

const FooterWrapper = styled(ButtonPressAnimation)`
  width: 100%;
  justify-content: center;
  align-items: center;
  height: 40;
  padding-bottom: 10;
`;

function ListFooterComponent({ label, onPress }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      onPress();
      setIsLoading(false);
    }
  }, [isLoading, setIsLoading, onPress]);
  const onPressWrapper = () => {
    setIsLoading(true);
  };
  return (
    <FooterWrapper onPress={onPressWrapper}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Text
          align="center"
          color={colors.grey}
          lineHeight="loose"
          size="small"
        >
          {label}
        </Text>
      )}
    </FooterWrapper>
  );
}

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
  nextPage,
  remainingItemsLabel,
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
    ) : isEmpty ? (
      <ActivityListEmptyState>{header}</ActivityListEmptyState>
    ) : (
      <SectionList
        ListFooterComponent={() =>
          remainingItemsLabel && (
            <ListFooterComponent
              label={remainingItemsLabel}
              onPress={nextPage}
            />
          )
        }
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
