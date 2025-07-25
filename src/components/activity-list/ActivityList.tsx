import { TOP_INSET } from '@/components/DappBrowser/Dimensions';
import { FastTransactionCoinRow } from '@/components/coin-row';
import { TransactionItemForSectionList, TransactionSections } from '@/helpers/buildTransactionsSectionsSelector';
import { lazyMount } from '@/helpers/lazyMount';
import { useAccountTransactions } from '@/hooks';
import { Skeleton } from '@/screens/points/components/Skeleton';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { LegendList, LegendListRef } from '@legendapp/list';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import Text from '../text/Text';
import ActivityListEmptyState from './ActivityListEmptyState';
import ActivityListHeader from './ActivityListHeader';

const PANEL_HEIGHT = DEVICE_HEIGHT - TOP_INSET - safeAreaInsetValues.bottom;

const sx = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 18,
  },
});

const keyExtractor = (data: ListItems) => data.key;

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

type ListItems =
  | { key: string; type: 'item'; value: TransactionItemForSectionList }
  | { key: string; type: 'header'; value: TransactionSections }
  | { key: string; type: 'loading' }
  | { key: string; type: 'paddingTopForNavBar' };

// keeping everything the same height here since we basically can pretty easily
// improves performance and reduces jitter (until move to new architecture)
const ITEM_HEIGHT = 59;

const ActivityList = lazyMount(({ scrollY, paddingTopForNavBar }: { scrollY?: SharedValue<number>; paddingTopForNavBar?: boolean }) => {
  const accountAddress = useAccountAddress();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { sections, nextPage, transactionsCount, remainingItemsLabel, isLoadingTransactions } = useAccountTransactions();

  const theme = useTheme();

  // Flatten sections into a single data array for LegendList
  const flatData = useMemo(() => {
    const items: ListItems[] = [];

    if (paddingTopForNavBar) {
      items.push({ key: 'paddingTopForNavBar', type: 'paddingTopForNavBar' });
    }

    if (isLoadingTransactions) {
      items.push({ key: 'loading', type: 'loading' });
    } else {
      sections.forEach(section => {
        if (section.data.length > 0) {
          items.push({ key: `${accountAddress}${section.title}`, type: 'header', value: section });
          for (const item of section.data) {
            const key = `${item.chainId}${'requestId' in item ? item.requestId : item.hash}`;
            items.push({
              key: `${accountAddress}${key}-entry`,
              type: 'item',
              value: item,
            });
          }
        }
      });
    }

    return items;
  }, [accountAddress, isLoadingTransactions, paddingTopForNavBar, sections]);

  const renderItem = useCallback(
    ({ item }: { item: ListItems }) => {
      if (item.type === 'paddingTopForNavBar') {
        return <View style={{ height: 68 }} />;
      }

      if (item.type === 'loading') {
        return (
          <>
            <LoadingActivityItem />
            <LoadingActivityItem />
            <LoadingActivityItem />
            <LoadingActivityItem />
          </>
        );
      }

      if (item.type === 'header') {
        return (
          <View style={[sx.sectionHeader, { backgroundColor: theme.colors.white, height: ITEM_HEIGHT }]}>
            {/* push month header to bottom */}
            <View style={{ flex: 1 }} />
            <ActivityListHeader title={item.value.title} />
          </View>
        );
      }

      return (
        <FastTransactionCoinRow
          // @nate: this as any was here prior to change to legend-list
          item={item.value as any}
          theme={theme}
          nativeCurrency={nativeCurrency}
        />
      );
    },
    [nativeCurrency, theme]
  );

  const listRef = useRef<LegendListRef | null>(null);

  return (
    <LegendList
      data={flatData}
      style={{
        // needs flex 1 or else going from loading => loaded scroll doesn't work
        flex: 1,
      }}
      // changing key - we had a bug with key calculation where headers were
      // matching causing legend list to see the key move index and scroll to a
      // bad position i tried fixing just the key to avoid changing the key
      // here, but then legend list will not scroll to the top on switching
      // wallets from home, in fact it seems to keep the scroll position down
      // even if it was at the top before sometimes. so changing the key here
      // ensures the list fully re-renders and has the correct scroll position
      key={accountAddress}
      ref={listRef}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingBottom: !transactionsCount ? 0 : 90 }}
      testID={'wallet-activity-list'}
      ListEmptyComponent={<ActivityListEmptyState />}
      ListFooterComponent={() =>
        !isLoadingTransactions && remainingItemsLabel && <ListFooterComponent label={remainingItemsLabel} onPress={nextPage} />
      }
      // recycleItems
      // this caused issues when going from a wallet with many items that had scrolling
      // to a wallet that has no scrollable area, causing it to show blank
      // maintainVisibleContentPosition
      drawDistance={PANEL_HEIGHT / 2}
      estimatedItemSize={ITEM_HEIGHT}
      {...(scrollY && {
        onScroll: event => {
          'worklet';
          if (scrollY) {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }
        },
      })}
    />
  );
});

const LoadingActivityItem = memo(function LoadingActivityItem() {
  return (
    <View style={{ height: 44, marginHorizontal: 20, marginVertical: 3 }}>
      <Skeleton width="100%" height={44} />
    </View>
  );
});

export default ActivityList;
