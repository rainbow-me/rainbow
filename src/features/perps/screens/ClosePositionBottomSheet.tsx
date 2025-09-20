import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedText, Box, Text, useColorMode, useForegroundColor } from '@/design-system';
import { PerpsAccentColorContextProvider, usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
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
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { closeIsolatedMarginPosition } from '@/features/perps/utils/hyperliquid';
import { PositionPercentageSlider } from '@/features/perps/components/PositionPercentageSlider';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { PerpBottomSheetHeader } from '@/features/perps/components/PerpBottomSheetHeader';
import { HANDLE_COLOR, LIGHT_HANDLE_COLOR, SLIDER_WIDTH } from '@/features/perps/constants';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { mulWorklet } from '@/safe-math/SafeMath';
import { logger, RainbowError } from '@/logger';
import { HoldToActivateButton } from '@/screens/token-launcher/components/HoldToActivateButton';
import { colors } from '@/styles';

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
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCloseDisabled, setIsCloseDisabled] = useState(false);
  const percentToClose = useSharedValue(1);
  const position = useHyperliquidAccountStore(state => state.getPosition(symbol));
  const navigation = useNavigation();
  const isNegativePnl = position ? Number(position.unrealizedPnl) < 0 : false;
  const pnlLabel = isNegativePnl ? 'Estimated Loss' : 'Estimated Profit';
  const pnlColor = isNegativePnl ? 'red' : 'green';

  useAnimatedReaction(
    () => percentToClose.value,
    (current, previous) => {
      if (current === 0) {
        runOnJS(setIsCloseDisabled)(true);
      } else if (previous === 0 && current !== 0) {
        runOnJS(setIsCloseDisabled)(false);
      }
    },
    []
  );

  const liveTokenPrice = useLiveTokenValue({
    tokenId: getHyperliquidTokenId(symbol),
    initialValue: '0',
    selector: state => state.midPrice ?? state.price,
  });

  const positionEquity = position ? position.equity : '0';

  const projectedPnl = useDerivedValue(() => {
    if (!position) return '-';
    return `${isNegativePnl ? '' : '+'}${formatCurrency(mulWorklet(position.unrealizedPnl, percentToClose.value))}`;
  }, [position, percentToClose, isNegativePnl]);

  const closePosition = useCallback(async () => {
    if (!position) return;
    setIsSubmitting(true);
    try {
      await closeIsolatedMarginPosition({
        symbol,
        price: liveTokenPrice,
        size: mulWorklet(position.size, percentToClose.value),
      });
      navigation.goBack();
    } catch (e) {
      logger.error(new RainbowError('[ClosePositionBottomSheet] Failed to close position', e));
    }
    setIsSubmitting(false);
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
              {formatCurrency(positionEquity)}
            </AnimatedText>
          </Box>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="full">
            <Text size="17pt" weight="medium" color={'labelSecondary'}>
              {pnlLabel}
            </Text>
            <AnimatedText size="17pt" weight="semibold" color={pnlColor}>
              {projectedPnl}
            </AnimatedText>
          </Box>
        </Box>
        <HoldToActivateButton
          disabled={isCloseDisabled}
          backgroundColor={accentColors.opacity100}
          disabledBackgroundColor={accentColors.opacity24}
          isProcessing={isSubmitting}
          showBiometryIcon={false}
          processingLabel={'Closing...'}
          label={'Hold to Close'}
          onLongPress={closePosition}
          height={48}
          textStyle={{
            color: isDarkMode ? colors.black : colors.white,
            fontSize: 20,
            fontWeight: '900',
          }}
          progressColor={isDarkMode ? colors.black : colors.white}
        />
      </Box>
    </Box>
  );
}

export const ClosePositionBottomSheet = memo(function ClosePositionBottomSheet() {
  const {
    params: { symbol },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.CLOSE_POSITION_BOTTOM_SHEET>>();
  const { isDarkMode } = useColorMode();

  const separatorSecondaryColor = useForegroundColor('separatorSecondary');

  return (
    <PerpsAccentColorContextProvider>
      <PanelSheet>
        <Panel height={PANEL_HEIGHT} innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
          <SheetHandleFixedToTop color={isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR} showBlur={true} top={14} />
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
