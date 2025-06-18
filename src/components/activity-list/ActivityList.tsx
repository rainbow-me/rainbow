import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import Text from '../text/Text';
import ActivityListEmptyState from './ActivityListEmptyState';
import ActivityListHeader from './ActivityListHeader';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import { useSectionListScrollToTopContext } from '@/navigation/SectionListScrollToTopContext';
import { useAccountSettings, useAccountTransactions } from '@/hooks';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { TransactionSections, TransactionItemForSectionList } from '@/helpers/buildTransactionsSectionsSelector';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { FastTransactionCoinRow } from '@/components/coin-row';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { TOP_INSET } from '@/components/DappBrowser/Dimensions';
import { safeAreaInsetValues } from '@/utils';

const PANEL_HEIGHT = DEVICE_HEIGHT - TOP_INSET - safeAreaInsetValues.bottom;

const sx = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 18,
  },
});

const keyExtractor = (data: ListItems, _index: number) => {
  if (data.type === 'header') {
    return data.value.title;
  }
  const { value } = data;
  if ('requestId' in value) {
    return `${value.requestId}`;
  }
  return value.hash;
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

type ListItems = { type: 'item'; value: TransactionItemForSectionList } | { type: 'header'; value: TransactionSections };

const ActivityList = () => {
  const accountAddress = useAccountAddress();
  const { nativeCurrency } = useAccountSettings();

  const { setScrollToTopRef } = useSectionListScrollToTopContext<TransactionItemForSectionList, TransactionSections>();
  const { sections, nextPage, transactionsCount, remainingItemsLabel } = useAccountTransactions();
  const pendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions[accountAddress] || []);

  const theme = useTheme();

  // Flatten sections into a single data array for LegendList
  const flatData = useMemo(() => {
    const items: ListItems[] = [];

    console.log('make sections', sections.length);

    sections.forEach(section => {
      if (section.data.length > 0) {
        items.push({ type: 'header', value: section });
        for (const item of section.data) {
          items.push({
            type: 'item',
            value: item,
          });
        }
      }
    });
    return items;
  }, [sections]);

  const renderItem = useCallback(
    ({ item }: { item: ListItems }) => {
      if ('type' in item && item.type === 'header') {
        return (
          <View style={[sx.sectionHeader, { backgroundColor: theme.colors.white }]}>
            <ActivityListHeader title={item.value.title} />
          </View>
        );
      }

      return <FastTransactionCoinRow item={item.value as any} theme={theme} nativeCurrency={nativeCurrency} />;
    },
    [theme]
  );

  const handleScrollToTopRef = useCallback((ref: any) => {
    if (!ref) return;
    setScrollToTopRef(ref);
  }, []);

  return (
    <LegendList
      data={flatData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ref={handleScrollToTopRef}
      contentContainerStyle={{ paddingBottom: !transactionsCount ? 0 : 90 }}
      extraData={{
        hasPendingTransaction: pendingTransactions.length > 0,
        nativeCurrency,
        pendingTransactionsCount: pendingTransactions.length,
      }}
      testID={'wallet-activity-list'}
      ListEmptyComponent={<ActivityListEmptyState />}
      ListFooterComponent={() => remainingItemsLabel && <ListFooterComponent label={remainingItemsLabel} onPress={nextPage} />}
      recycleItems
      maintainVisibleContentPosition
      removeClippedSubviews
      drawDistance={PANEL_HEIGHT / 2}
      estimatedItemSize={60}
    />
  );
};

export default ActivityList;
