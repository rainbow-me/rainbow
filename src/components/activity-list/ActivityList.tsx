import React, { useEffect, useMemo, useState } from 'react';
import { SectionList } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import networkTypes from '../../helpers/networkTypes';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../ActivityIndicator' was resolved to '/Us... Remove this comment to see the full error message
import ActivityIndicator from '../ActivityIndicator';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Spinner' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { CoinRowHeight } from '../coin-row';
import Text from '../text/Text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ActivityListEmptyState' was resolved to ... Remove this comment to see the full error message
import ActivityListEmptyState from './ActivityListEmptyState';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ActivityListHeader' was resolved to '/Us... Remove this comment to see the full error message
import ActivityListHeader from './ActivityListHeader';
// @ts-expect-error ts-migrate(6142) FIXME: Module './RecyclerActivityList' was resolved to '/... Remove this comment to see the full error message
import RecyclerActivityList from './RecyclerActivityList';

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'data' implicitly has an 'any' type.
const getItemLayout = (data, index) => ({
  index,
  length: CoinRowHeight,
  offset: CoinRowHeight * index,
});

const keyExtractor = ({ hash, timestamp, transactionDisplayDetails }: any) =>
  hash ||
  (timestamp ? timestamp.ms : transactionDisplayDetails?.timestampInMs || 0);

const renderSectionHeader = ({ section }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <ActivityListHeader {...section} />
);

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const LoadingSpinner = android ? Spinner : ActivityIndicator;

const FooterWrapper = styled(ButtonPressAnimation)`
  width: 100%;
  justify-content: center;
  align-items: center;
  height: 40;
  padding-bottom: 10;
`;

function ListFooterComponent({ label, onPress }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FooterWrapper onPress={onPressWrapper}>
      {isLoading ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <LoadingSpinner />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.3)}
          lineHeight="loose"
          size="smedium"
          weight="bold"
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
  remainingItemsLabel,
}: any) => {
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <RecyclerActivityList
        addCashAvailable={addCashAvailable}
        header={header}
        isEmpty={isEmpty}
        isLoading={isLoading}
        navigation={navigation}
        sections={sections}
      />
    ) : isEmpty ? (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ActivityListEmptyState>{header}</ActivityListEmptyState>
    ) : (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <SectionList
        ListFooterComponent={() =>
          remainingItemsLabel && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ActivityListEmptyState
      emoji="👻"
      label="Your testnet transaction history starts now!"
    >
      {header}
    </ActivityListEmptyState>
  );
};

export default ActivityList;
