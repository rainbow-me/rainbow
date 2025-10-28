import { LegendList } from '@legendapp/list';
import React, { memo, useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Navbar } from '@/components/navbar/Navbar';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { HYPERLIQUID_COLORS, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { TradeListItem } from '@/features/perps/components/TradeListItem';
import { useHlTradesStore } from '@/features/perps/stores/hlTradesStore';
import { HlTrade } from '@/features/perps/types';
import { Box, Separator, Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import infinityIcon from '@/assets/infinity.png';

const ESTIMATED_ITEM_HEIGHT = 68;
const SCROLL_INSETS = { bottom: 48 };

export const PerpsTradeHistoryScreen = memo(function PerpsTradeHistoryScreen() {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const trades = useHlTradesStore(state => state.getTrades() ?? []);

  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  const tradesCountLabel = useMemo(() => {
    return i18n.t(i18n.l.perps.activity.trades_count, { count: trades.length });
  }, [trades.length]);

  return (
    <PerpsAccentColorContextProvider>
      <Box backgroundColor={backgroundColor} flexGrow={1} width="full">
        <Box alignItems="center" backgroundColor={backgroundColor} width="full">
          <SheetHandle />
          <Box marginTop={{ custom: safeAreaInsets.top + 16 }} width="full">
            <Navbar
              titleComponent={
                <Box alignItems="center" gap={12}>
                  <Text align="center" color="label" size="20pt" weight="heavy">
                    {`${i18n.t(i18n.l.perps.common.title)} ${i18n.t(i18n.l.perps.activity.title)}`}
                  </Text>
                  <Text align="center" color="labelQuaternary" size="11pt" weight="heavy">
                    {tradesCountLabel}
                  </Text>
                </Box>
              }
            />
          </Box>
        </Box>
        <Box marginTop={{ custom: 8 }} paddingHorizontal="24px">
          <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
        </Box>
        <LegendList
          ItemSeparatorComponent={() => <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />}
          ListEmptyComponent={
            <Box alignItems="center" justifyContent="center" paddingVertical={{ custom: 40 }}>
              <Box height={124} justifyContent="center" alignItems="center" gap={20} paddingBottom="24px">
                <Image source={infinityIcon} tintColor={HYPERLIQUID_COLORS.green} />
                <Text align="center" size="20pt" weight="heavy" color="labelSecondary">
                  {i18n.t(i18n.l.perps.activity.no_previous_trades)}
                </Text>
              </Box>
            </Box>
          }
          contentContainerStyle={styles.contentContainer}
          data={trades}
          estimatedItemSize={ESTIMATED_ITEM_HEIGHT}
          keyExtractor={keyExtractor}
          renderItem={renderTradeItem}
          scrollIndicatorInsets={SCROLL_INSETS}
          style={styles.list}
        />
      </Box>
    </PerpsAccentColorContextProvider>
  );
});

function renderTradeItem({ item }: { item: HlTrade }) {
  return <TradeListItem trade={item} showMarketIcon />;
}

function keyExtractor(trade: HlTrade): string {
  return String(trade.id);
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  list: {
    flex: 1,
  },
});
