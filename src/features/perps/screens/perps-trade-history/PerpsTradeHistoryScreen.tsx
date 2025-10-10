import { LegendList } from '@legendapp/list';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Navbar } from '@/components/navbar/Navbar';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { TradeListItem } from '@/features/perps/components/TradeListItem';
import { useHlTradesStore } from '@/features/perps/stores/hlTradesStore';
import { HlTrade } from '@/features/perps/types';
import { Box, Separator, Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEM_SEPARATOR = () => <Separator color="separatorTertiary" direction="horizontal" thickness={4 / 3} />;
const ESTIMATED_ITEM_HEIGHT = 104;
const BASE_BOTTOM_PADDING = 32;

export const PerpsTradeHistoryScreen = memo(function PerpsTradeHistoryScreen() {
  const { isDarkMode } = useColorMode();
  const insets = useSafeAreaInsets();
  const trades = useHlTradesStore(state => state.getTrades() ?? []);

  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  const ordersCountLabel = useMemo(() => {
    return i18n.t(i18n.l.perps.history.orders_count, { count: trades.length });
  }, [trades.length]);

  const sortedTrades = useMemo(() => {
    return trades.slice().sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }, [trades]);

  const renderTradeItem = useCallback(({ item, index }: { item: HlTrade; index: number }) => {
    return <TradeListItem paddingTop={index === 0 ? '8px' : '16px'} trade={item} showMarketIcon />;
  }, []);

  const contentContainerStyle = useMemo(
    () => [styles.contentContainer, { paddingBottom: BASE_BOTTOM_PADDING + insets.bottom }],
    [insets.bottom]
  );

  return (
    <PerpsAccentColorContextProvider>
      <Box backgroundColor={backgroundColor} flexGrow={1} width="full">
        <SheetHandle />

        <Box paddingBottom="20px" paddingTop="24px">
          <Navbar
            hasStatusBarInset
            titleComponent={
              <Box alignItems="center" gap={12}>
                <Text align="center" color="label" size="20pt" weight="heavy">
                  {`${i18n.t(i18n.l.perps.common.title)} ${i18n.t(i18n.l.perps.history.title)}`}
                </Text>
                <Text align="center" color="labelQuaternary" size="11pt" weight="heavy">
                  {ordersCountLabel}
                </Text>
              </Box>
            }
          />
        </Box>
        {ITEM_SEPARATOR()}

        <LegendList
          ItemSeparatorComponent={ITEM_SEPARATOR}
          ListEmptyComponent={
            <Box alignItems="center" justifyContent="center" paddingVertical={{ custom: 40 }}>
              <Text color="labelQuaternary" size="17pt" weight="heavy">
                {i18n.t(i18n.l.perps.history.no_trades)}
              </Text>
            </Box>
          }
          ListFooterComponent={<Box height={24} />}
          contentContainerStyle={contentContainerStyle}
          data={sortedTrades}
          estimatedItemSize={ESTIMATED_ITEM_HEIGHT}
          keyExtractor={keyExtractor}
          maintainVisibleContentPosition={false}
          renderItem={renderTradeItem}
          scrollIndicatorInsets={{ bottom: insets.bottom, top: 0 }}
          style={styles.list}
        />
      </Box>
    </PerpsAccentColorContextProvider>
  );
});

function keyExtractor(trade: HlTrade): string {
  return `${trade.id}`;
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  list: {
    flex: 1,
  },
});
