import React, { useCallback, useEffect, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import sectionListGetItemLayout from 'react-native-section-list-get-item-layout';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { CoinRowHeight } from '../coin-row/CoinRow';
import Text from '../text/Text';
import ActivityListEmptyState from './ActivityListEmptyState';
import ActivityListHeader from './ActivityListHeader';
import styled from '@/styled-thing';
import { ThemeContextProps, useTheme } from '@/theme';
import { useSectionListScrollToTopContext } from '@/navigation/SectionListScrollToTopContext';
import { safeAreaInsetValues } from '@/utils';
import { useAccountSettings, useAccountTransactions } from '@/hooks';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { TransactionSections, TransactionItemForSectionList } from '@/helpers/buildTransactionsSectionsSelector';

const sx = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 18,
  },
});

const ActivityListHeaderHeight = 42;
const TRANSACTION_COIN_ROW_VERTICAL_PADDING = 7;

const getItemLayout = sectionListGetItemLayout({
  getItemHeight: () => CoinRowHeight + TRANSACTION_COIN_ROW_VERTICAL_PADDING * 2,
  getSectionHeaderHeight: () => ActivityListHeaderHeight,
});

const keyExtractor = (data: TransactionSections['data'][number]) => {
  if ('hash' in data) {
    return (data.hash || data.timestamp ? data.timestamp?.toString() : performance.now().toString()) ?? performance.now().toString();
  }
  return (
    (data.displayDetails?.timestampInMs ? data.displayDetails.timestampInMs.toString() : performance.now().toString()) ??
    performance.now().toString()
  );
};

const renderSectionHeader = ({ section, colors }: { section: TransactionSections; colors: ThemeContextProps['colors'] }) => {
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

function ListFooterComponent({ label, onPress }: { label: string; onPress: () => void }) {
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
        <Text align="center" color={colors.alpha(colors.blueGreyDark, 0.3)} lineHeight="loose" size="smedium" weight="bold">
          {label}
        </Text>
      )}
    </FooterWrapper>
  );
}

const ActivityList = () => {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const { setScrollToTopRef } = useSectionListScrollToTopContext<TransactionItemForSectionList, TransactionSections>();
  const { sections, nextPage, transactionsCount, remainingItemsLabel } = useAccountTransactions();
  const pendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions[accountAddress] || []);

  const { colors } = useTheme();
  const renderSectionHeaderWithTheme = useCallback(
    ({ section }: { section: TransactionSections }) => renderSectionHeader({ colors, section }),
    [colors]
  );

  const handleScrollToTopRef = (ref: SectionList<TransactionItemForSectionList, TransactionSections> | null) => {
    if (!ref) return;
    setScrollToTopRef(ref);
  };

  return (
    <SectionList<TransactionItemForSectionList, TransactionSections>
      ListFooterComponent={() => remainingItemsLabel && <ListFooterComponent label={remainingItemsLabel} onPress={nextPage} />}
      ref={handleScrollToTopRef}
      alwaysBounceVertical={false}
      contentContainerStyle={{ paddingBottom: !transactionsCount ? 0 : 90 }}
      extraData={{
        hasPendingTransaction: pendingTransactions.length > 0,
        nativeCurrency,
        pendingTransactionsCount: pendingTransactions.length,
      }}
      testID={'wallet-activity-list'}
      ListEmptyComponent={<ActivityListEmptyState />}
      // @ts-expect-error - mismatch between react-native-section-list-get-item-layout and SectionList
      getItemLayout={getItemLayout}
      initialNumToRender={12}
      keyExtractor={keyExtractor}
      removeClippedSubviews
      renderSectionHeader={renderSectionHeaderWithTheme}
      scrollIndicatorInsets={{
        bottom: safeAreaInsetValues.bottom + 14,
      }}
      sections={sections}
    />
  );
};

export default ActivityList;
