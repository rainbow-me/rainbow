import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedText, Box, Text, useForegroundColor } from '@/design-system';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { TapToDismiss } from '@/components/DappBrowser/control-panel/ControlPanel';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { safeAreaInsetValues } from '@/utils';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { hyperliquidAccountStoreActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { PositionPercentageSlider } from '@/features/perps/components/PositionPercentageSlider';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { PerpBottomSheetHeader } from '@/features/perps/components/PerpBottomSheetHeader';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { SLIDER_WIDTH } from '@/features/perps/constants';
import { estimateReturnOnMarketClose } from '@/features/perps/utils/estimateReturnOnMarketClose';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { mulWorklet } from '@/safe-math/SafeMath';
import { logger, RainbowError } from '@/logger';

const PANEL_HEIGHT = 400;

function PanelSheet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.panelContainer}>
      <TapToDismiss />
      {children}
    </View>
  );
}

type PanelContentProps = {
  symbol: string;
};

function PanelContent({ symbol }: PanelContentProps) {
  const percentToClose = useSharedValue(1);
  const position = useHyperliquidAccountStore(state => state.getPosition(symbol));
  const navigation = useNavigation();

  const liveTokenPrice = useLiveTokenValue({
    tokenId: getHyperliquidTokenId(symbol),
    initialValue: '0',
    selector: state => state.midPrice ?? state.price,
  });

  const positionEquity = position
    ? estimateReturnOnMarketClose({
        position,
        exitPrice: liveTokenPrice,
        feeBips: 0,
      })
    : '0';

  const projectedToReceive = useDerivedValue(() => {
    if (!position) return '-';

    const totalValue = estimateReturnOnMarketClose({
      position,
      exitPrice: liveTokenPrice,
      feeBips: 0,
    });

    const adjustedValue = mulWorklet(totalValue, percentToClose.value);
    return formatCurrency(adjustedValue);
  });

  const projectedPnl = useDerivedValue(() => {
    if (!position) return '-';
    return formatCurrency(mulWorklet(position.unrealizedPnl, percentToClose.value));
  });

  const closePosition = useCallback(async () => {
    if (!position) return;
    try {
      await hyperliquidAccountStoreActions.closeIsolatedMarginPosition({
        symbol,
        price: liveTokenPrice,
        size: mulWorklet(position.size, percentToClose.value),
      });
      navigation.goBack();
    } catch (e) {
      logger.error(new RainbowError('[ClosePositionBottomSheet] Failed to close position', e));
    }
  }, [position, symbol, liveTokenPrice, navigation, percentToClose]);

  if (!position) return null;

  return (
    <Box paddingHorizontal={'24px'} paddingTop={'28px'} alignItems="center" style={{ flex: 1 }}>
      <Box width="full" gap={24}>
        <PerpBottomSheetHeader title="Close Position" symbol={symbol} />
        <PositionPercentageSlider
          totalValue={formatCurrency(positionEquity)}
          title="Amount"
          percentageValue={percentToClose}
          sliderWidth={SLIDER_WIDTH - 8 * 2}
        />
        <Box
          backgroundColor={opacityWorklet(ETH_COLOR_DARK, 0.03)}
          borderWidth={THICK_BORDER_WIDTH}
          borderColor={'buttonStroke'}
          borderRadius={24}
          paddingVertical={'20px'}
          paddingHorizontal={'16px'}
          gap={24}
        >
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="full">
            <Text size="17pt" weight="medium" color={'labelSecondary'}>
              {`Receive`}
            </Text>
            <AnimatedText size="17pt" weight="semibold" color={'labelSecondary'}>
              {projectedToReceive}
            </AnimatedText>
          </Box>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="full">
            <Text size="17pt" weight="medium" color={'labelSecondary'}>
              {`Estimated PNL`}
            </Text>
            <AnimatedText size="17pt" weight="semibold" color={'labelSecondary'}>
              {projectedPnl}
            </AnimatedText>
          </Box>
        </Box>
        <HyperliquidButton onPress={closePosition}>
          <Text size="20pt" weight="heavy" color={'black'}>
            {'Close Position'}
          </Text>
        </HyperliquidButton>
      </Box>
    </Box>
  );
}

export const ClosePositionBottomSheet = memo(function ClosePositionBottomSheet() {
  const {
    params: { symbol },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.CLOSE_POSITION_BOTTOM_SHEET>>();

  const separatorSecondaryColor = useForegroundColor('separatorSecondary');

  return (
    <PerpsAccentColorContextProvider>
      <PanelSheet>
        <Panel height={PANEL_HEIGHT} innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
          <SheetHandleFixedToTop color={opacityWorklet('#F5F8FF', 0.3)} showBlur={true} top={14} />
          <PanelContent symbol={symbol} />
        </Panel>
      </PanelSheet>
    </PerpsAccentColorContextProvider>
  );
});

const styles = StyleSheet.create({
  panelContainer: {
    alignItems: 'center',
    flex: 1,
    height: DEVICE_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
    pointerEvents: 'box-none',
  },
});
