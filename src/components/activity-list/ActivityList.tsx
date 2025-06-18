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

const sx = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 18,
  },
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
  const accountAddress = useAccountAddress();
  const { nativeCurrency } = useAccountSettings();

  const { setScrollToTopRef } = useSectionListScrollToTopContext<TransactionItemForSectionList, TransactionSections>();
  const { sections, nextPage, transactionsCount, remainingItemsLabel } = useAccountTransactions();
  const pendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions[accountAddress] || []);

  const { colors } = useTheme();

  // Flatten sections into a single data array for LegendList
  const flatData = useMemo(() => {
    const items: (TransactionItemForSectionList | { type: 'section-header'; section: TransactionSections })[] = [];

    console.log('make sections', sections.length);

    sections.forEach(section => {
      if (section.data.length > 0) {
        items.push({ type: 'section-header', section });
        items.push(...section.data);
      }
    });
    return items;
  }, [sections]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof flatData)[0] }) => {
      console.log('render', item);
      if ('type' in item && item.type === 'section-header') {
        const sectionItem = item as { type: 'section-header'; section: TransactionSections };
        return (
          <View style={[sx.sectionHeader, { backgroundColor: colors.white }]}>
            <ActivityListHeader title={sectionItem.section.title} />
          </View>
        );
      }
      // Render transaction item - you'll need to replace this with your actual transaction item renderer
      return (
        <View style={{ height: 60 }}>
          <Text>Transaction Item</Text>
        </View>
      );
    },
    [colors]
  );

  const keyExtractorFlat = useCallback((item: (typeof flatData)[0], index: number) => {
    if ('type' in item && item.type === 'section-header') {
      const sectionItem = item as { type: 'section-header'; section: TransactionSections };
      return `section-${sectionItem.section.title}-${index}`;
    }
    return keyExtractor(item as TransactionSections['data'][number]);
  }, []);

  const handleScrollToTopRef = useCallback((ref: any) => {
    if (!ref) return;
    setScrollToTopRef(ref);
  }, []);

  console.log('flatData', JSON.stringify(flatData, null, 2));

  return (
    <LegendList
      data={flatData}
      renderItem={renderItem}
      keyExtractor={keyExtractorFlat}
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
      // recycleItems
      // maintainVisibleContentPosition
      style={{
        flex: 1,
        backgroundColor: 'red',
      }}
    />
  );
};

export default ActivityList;
