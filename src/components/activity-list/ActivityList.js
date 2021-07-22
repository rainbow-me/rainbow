import React, { useEffect, useMemo, useState } from 'react';
import { SectionList } from 'react-native';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import networkTypes from '../../helpers/networkTypes';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { ShowMoreButton } from '../buttons';
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
  margin-bottom: 50;
`;

const Spacer = styled.View`
  height: 20;
`;

function ListFooterComponent({ onPress }) {
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) {
      onPress();
      setIsLoading(false);
    }
  }, [isLoading, setIsLoading, onPress]);
  const onPressLoadMore = () => {
    setIsLoading(true);
  };
  return (
    <FooterWrapper>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ShowMoreButton
          backgroundColor={colors.alpha(colors.blueGreyDark, 0.06)}
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          onPress={onPressLoadMore}
          paddingTop={10}
        />
      )}
    </FooterWrapper>
  );
}

const ActivityList = ({
  hasPendingTransaction,
  header,
  nativeCurrency,
  sections,
  requests,
  transactionsCount,
  addCashAvailable,
  isEmpty,
  isLoading,
  navigation,
  network,
  recyclerListView,
  nextPage,
  hasTransactionsToLoad,
}) => {
  const pendingTransactionsCount = useMemo(() => {
    let currentPendingTransactionsCount = 0;
    const pendingTxSection = sections[requests?.length ? 1 : 0];

    if (pendingTxSection && pendingTxSection.title === 'Pending') {
      currentPendingTransactionsCount = pendingTxSection.data.length;
    }
    return currentPendingTransactionsCount;
  }, [sections, requests]);
  return network === networkTypes.mainnet || sections.length ? (
    recyclerListView ? (
      <RecyclerActivityList
        addCashAvailable={addCashAvailable}
        footerComponent={() =>
          hasTransactionsToLoad ? (
            <ListFooterComponent
              onPress={nextPage}
              show={hasTransactionsToLoad}
            />
          ) : (
            <Spacer />
          )
        }
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
          hasTransactionsToLoad ? (
            <ListFooterComponent
              onPress={nextPage}
              show={hasTransactionsToLoad}
            />
          ) : (
            <Spacer />
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

export default ActivityList;
