import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Box, globalColors, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { type RouteProp, useRoute } from '@react-navigation/native';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { type HlTrade } from '@/features/perps/types';
import { TradeDetailsGraphic } from '@/features/perps/screens/perps-trade-details-sheet/TradeDetailsGraphic';
import { opacity } from '@/framework/ui/utils/opacity';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { PnlShareGraphic, type PnlShareImageHandle } from '@/features/perps/screens/perps-trade-details-sheet/PnlShareGraphic';
import { TradeDetailsSection } from '@/features/perps/screens/perps-trade-details-sheet/TradeDetailsSection';
import { ActivityIndicator, Share } from 'react-native';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { analytics } from '@/analytics';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { calculateTradePnlPercentage } from '@/features/perps/utils/calculateTradePnlPercentage';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';

export const PerpsTradeDetailsSheet = memo(function PerpsTradeDetailsSheet() {
  const {
    params: { trade },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.PERPS_TRADE_DETAILS_SHEET>>();
  const separatorSecondaryColor = useForegroundColor('separatorSecondary');

  return (
    <PerpsAccentColorContextProvider>
      <PanelSheet innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
        <PerpsTradeDetailsSheetContent trade={trade} />
      </PanelSheet>
    </PerpsAccentColorContextProvider>
  );
});

function PerpsTradeDetailsSheetContent({ trade }: { trade: HlTrade }) {
  const { isDarkMode } = useColorMode();
  const pnlShareImageRef = useRef<PnlShareImageHandle>(null);
  const [isSharing, setIsSharing] = useState(false);
  const market = useHyperliquidMarketsStore(state => state.getMarket(trade.symbol));
  const leverage = trade.leverage ?? market?.maxLeverage ?? 1;
  const entryPrice = trade.entryPrice ?? trade.price;
  const pnlPercentage = useMemo(
    () =>
      calculateTradePnlPercentage({
        entryPrice,
        markPrice: trade.price,
        isLong: trade.isLong,
        leverage,
      }),
    [entryPrice, leverage, trade.isLong, trade.price]
  );

  const handleShare = useCallback(async () => {
    analytics.track(analytics.event.perpsTradeDetailsSharePressed, {
      market: trade.symbol,
      direction: trade.isLong ? 'long' : 'short',
      pnlPercentage,
      pnl: trade.pnl,
      netPnl: trade.netPnl,
    });

    setIsSharing(true);
    try {
      const image = await pnlShareImageRef.current?.capture();
      if (!image) {
        return;
      }
      await Share.share({
        title: 'pnl',
        url: image,
      });
    } catch (e) {
      logger.error(new RainbowError('[PerpsTradeDetailsSheet]: Error sharing trade', e));
    } finally {
      setIsSharing(false);
    }
  }, [pnlPercentage, trade.isLong, trade.netPnl, trade.pnl, trade.symbol]);

  return (
    <Box paddingBottom={'20px'} alignItems="center">
      <TradeDetailsGraphic trade={trade} />
      <Box position="absolute" top={{ custom: 32 }}>
        <PnlShareGraphic trade={trade} pnlShareImageRef={pnlShareImageRef} />
      </Box>
      <Box width="full" paddingHorizontal="24px" paddingTop={'8px'} gap={24}>
        <HyperliquidButton onPress={handleShare} paddingVertical={'12px'} borderRadius={24} justifyContent={'center'} alignItems={'center'}>
          <InnerShadow color={opacity(globalColors.white100, 0.28)} blur={5} dx={0} dy={1} />
          {!isSharing ? (
            <Box flexDirection="row" alignItems="center" gap={8}>
              <TextIcon size="17pt" weight="black" color={isDarkMode ? 'black' : 'white'}>
                {'􀈂'}
              </TextIcon>
              <Text size="20pt" weight="black" color={isDarkMode ? 'black' : 'white'}>
                {i18n.t(i18n.l.button.share)}
              </Text>
            </Box>
          ) : (
            <ActivityIndicator color={'black'} />
          )}
        </HyperliquidButton>
        <TradeDetailsSection trade={trade} />
      </Box>
    </Box>
  );
}
