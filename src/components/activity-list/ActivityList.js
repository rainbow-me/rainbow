import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import sectionListGetItemLayout from 'react-native-section-list-get-item-layout';
import networkTypes from '../../helpers/networkTypes';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { CoinRowHeight } from '../coin-row/CoinRow';
import { TRANSACTION_COIN_ROW_VERTICAL_PADDING } from '../coin-row/TransactionCoinRow';
import Text from '../text/Text';
import ActivityListEmptyState from './ActivityListEmptyState';
import ActivityListHeader from './ActivityListHeader';
import RecyclerActivityList from './RecyclerActivityList';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';

const sx = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 18,
  },
});

const ActivityListHeaderHeight = 42;

const getItemLayout = sectionListGetItemLayout({
  getItemHeight: () =>
    CoinRowHeight + TRANSACTION_COIN_ROW_VERTICAL_PADDING * 2,
  getSectionHeaderHeight: () => ActivityListHeaderHeight,
});

const keyExtractor = ({ hash, timestamp, transactionDisplayDetails }) =>
  hash ||
  (timestamp ? timestamp.ms : transactionDisplayDetails?.timestampInMs || 0);

const renderSectionHeader = ({ section, colors }) => {
  return (
    <View style={[sx.sectionHeader, { backgroundColor: colors.white }]}>
      <ActivityListHeader {...section} />
    </View>
  );
};

const LoadingSpinner = android ? Spinner : ActivityIndicator;

const FooterWrapper = styled(ButtonPressAnimation)({
  alignItems: 'center',
  height: 40,
  justifyContent: 'center',
  paddingBottom: 10,
  width: '100%',
});

function ListFooterComponent({ label, onPress }) {
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
    <FooterWrapper onPress={onPressWrapper}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
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
  addCashAvailable,
  hasPendingTransaction,
  header,
  isEmpty,
  isLoading,
  nativeCurrency,
  navigation,
  network,
  nextPage,
  recyclerListView,
  remainingItemsLabel,
  requests,
  sections,
  transactionsCount,
}) => {
  const pendingTransactionsCount = useMemo(() => {
    let currentPendingTransactionsCount = 0;
    const pendingTxSection = sections[requests?.length ? 1 : 0];

    if (pendingTxSection && pendingTxSection.title === 'Pending') {
      currentPendingTransactionsCount = pendingTxSection.data.length;
    }
    return currentPendingTransactionsCount;
  }, [sections, requests]);

  const { colors } = useTheme();
  const renderSectionHeaderWithTheme = useCallback(
    ({ section }) => renderSectionHeader({ colors, section }),
    [colors]
  );

  if (network === networkTypes.mainnet || sections.length) {
    if (isEmpty && !isLoading) {
      return <ActivityListEmptyState>{header}</ActivityListEmptyState>;
    } else if (recyclerListView) {
      return (
        <RecyclerActivityList
          addCashAvailable={addCashAvailable}
          header={null}
          isEmpty={isEmpty}
          isLoading={isLoading}
          navigation={navigation}
          sections={sections}
        />
      );
    } else {
      return (
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
          contentContainerStyle={{ paddingBottom: !transactionsCount ? 0 : 90 }}
          extraData={{
            hasPendingTransaction,
            nativeCurrency,
            pendingTransactionsCount,
          }}
          getItemLayout={getItemLayout}
          initialNumToRender={12}
          keyExtractor={keyExtractor}
          removeClippedSubviews
          renderSectionHeader={renderSectionHeaderWithTheme}
          sections={sections}
        />
      );
    }
  } else {
    return (
      <ActivityListEmptyState
        emoji="👻"
        label={lang.t('activity_list.empty_state.testnet_label')}
      >
        {header}
      </ActivityListEmptyState>
    );
  }
};

export default ActivityList;
