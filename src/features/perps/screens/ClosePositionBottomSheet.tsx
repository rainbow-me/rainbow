import React, { memo, useCallback, useMemo, useState } from 'react';
import { AnimatedText, Box, Inline, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { PerpsAccentColorContextProvider, usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { TapToDismiss } from '@/components/DappBrowser/control-panel/ControlPanel';
import { Panel, controlPanelStyles, PANEL_BOTTOM_OFFSET } from '@/components/SmoothPager/ListPanel';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getHyperliquidTokenId, parseHyperliquidErrorMessage } from '@/features/perps/utils';
import { ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { hyperliquidAccountActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { PositionPercentageSlider } from '@/features/perps/components/PositionPercentageSlider';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { PerpBottomSheetHeader } from '@/features/perps/components/PerpBottomSheetHeader';
import { HANDLE_COLOR, LIGHT_HANDLE_COLOR, MIN_ORDER_SIZE_USD, SLIDER_WIDTH } from '@/features/perps/constants';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { divWorklet, mulWorklet } from '@/safe-math/SafeMath';
import { logger, RainbowError } from '@/logger';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { colors } from '@/styles';
import i18n from '@/languages';
import { analytics } from '@/analytics';
import { useHlOpenOrdersStore } from '@/features/perps/stores/hlOpenOrdersStore';
import { TriggerOrderType } from '@/features/perps/types';
import { Alert } from 'react-native';
import { SLIDER_MAX } from '@/features/perps/components/Slider/Slider';

function PanelSheet({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useColorMode();
  return (
    <>
      <Box style={[controlPanelStyles.panelContainer, { bottom: PANEL_BOTTOM_OFFSET, alignItems: 'center', width: '100%' }]}>
        <SheetHandleFixedToTop color={isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR} showBlur={true} top={14} />
        {children}
      </Box>
      <TapToDismiss />
    </>
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
  const [isBelowMinimum, setIsBelowMinimum] = useState(false);
  const closeProgress = useSharedValue(SLIDER_MAX);
  const position = useHyperliquidAccountStore(state => state.getPosition(symbol));
  const navigation = useNavigation();
  const isNegativePnl = position ? Number(position.unrealizedPnl) < 0 : false;
  const pnlLabel = isNegativePnl ? i18n.perps.close_position.estimated_loss() : i18n.perps.close_position.estimated_profit();
  const pnlColor = isNegativePnl ? 'red' : 'green';

  const minPercentage = useMemo(() => {
    if (!position || Number(position.value) === 0) return '0';
    const percent = (MIN_ORDER_SIZE_USD / Number(position.value)) * SLIDER_MAX;
    return Math.ceil(percent);
  }, [position]);

  useAnimatedReaction(
    () => closeProgress.value,
    (current, previous) => {
      const closeValue = position ? Number(position.value) * (current / SLIDER_MAX) : 0;
      const belowMin = closeValue < MIN_ORDER_SIZE_USD && closeValue > 0;

      if (current === 0 || belowMin) {
        runOnJS(setIsCloseDisabled)(true);
        runOnJS(setIsBelowMinimum)(belowMin);
      } else if (
        (previous === null || previous === 0 || Number(position?.value ?? 0) * (previous / SLIDER_MAX) < MIN_ORDER_SIZE_USD) &&
        current !== 0 &&
        closeValue >= MIN_ORDER_SIZE_USD
      ) {
        runOnJS(setIsCloseDisabled)(false);
        runOnJS(setIsBelowMinimum)(false);
      }
    },
    [position]
  );

  const liveTokenPrice = useLiveTokenValue({
    tokenId: getHyperliquidTokenId(symbol),
    initialValue: '0',
    selector: state => state.midPrice ?? state.price,
  });

  const positionEquity = position ? position.equity : '0';
  const receivedAmount = useDerivedValue(() => {
    const ratio = closeProgress.value / SLIDER_MAX;
    return formatCurrency(mulWorklet(positionEquity, ratio));
  });

  const projectedPnl = useDerivedValue(() => {
    if (!position) return '-';
    const ratio = closeProgress.value / SLIDER_MAX;
    return `${isNegativePnl ? '' : '+'}${formatCurrency(mulWorklet(position.unrealizedPnl, ratio))}`;
  }, [position, closeProgress, isNegativePnl]);

  const closePosition = useCallback(async () => {
    if (!position) return;

    setIsSubmitting(true);

    const perpsBalance = Number(useHyperliquidAccountStore.getState().getValue());
    const closePercentage = Number(divWorklet(closeProgress.value, SLIDER_MAX));

    try {
      await hyperliquidAccountActions.closePosition({
        symbol,
        price: liveTokenPrice,
        size: mulWorklet(position.size, closePercentage),
      });

      const openOrders = useHlOpenOrdersStore.getState().getData()?.ordersBySymbol[symbol] || [];
      const triggerOrders = openOrders
        .filter(order => order.isPositionTpsl)
        .map(order => {
          const type = order.orderType === 'Stop Market' ? TriggerOrderType.STOP_LOSS : TriggerOrderType.TAKE_PROFIT;
          return {
            type,
            price: Number(order.triggerPrice),
          };
        });

      analytics.track(analytics.event.perpsClosedPosition, {
        market: symbol,
        side: position.side,
        leverage: position.leverage,
        perpsBalance,
        positionSize: Math.abs(Number(mulWorklet(position.size, closePercentage))),
        positionValue: Number(position.value) * closePercentage,
        exitPrice: Number(liveTokenPrice),
        pnl: Number(position.unrealizedPnl) * closePercentage,
        closePercentage,
        triggerOrders,
      });

      navigation.goBack();
    } catch (e) {
      const errorMessage = parseHyperliquidErrorMessage(e);
      analytics.track(analytics.event.perpsClosePositionFailed, {
        market: symbol,
        side: position.side,
        leverage: position.leverage,
        perpsBalance,
        errorMessage,
      });
      Alert.alert(i18n.perps.common.error_submitting_order(), errorMessage);
      logger.error(new RainbowError('[ClosePositionBottomSheet] Failed to close position', e));
    }
    setIsSubmitting(false);
  }, [position, symbol, liveTokenPrice, navigation, closeProgress]);

  if (!position) return null;

  return (
    <Box paddingHorizontal={'24px'} paddingTop={'28px'} paddingBottom={'20px'} alignItems="center" style={{ flex: 1 }}>
      <Box width="full" gap={24}>
        <PerpBottomSheetHeader title={i18n.perps.actions.close_position()} symbol={symbol} />
        <Box>
          {isBelowMinimum && (
            <Box paddingBottom={'12px'} justifyContent="center" paddingHorizontal={'8px'}>
              <Inline alignVertical="center" space={'6px'}>
                <TextIcon color="red" size="13pt" weight="bold">
                  {'􀇿'}
                </TextIcon>
                <Text color="labelTertiary" size="15pt" weight="bold">
                  {`${i18n.perps.close_position.minimum_amount_is()} `}
                  <Text color="labelSecondary" size="15pt" weight="heavy">
                    {`${minPercentage}%`}
                  </Text>
                </Text>
              </Inline>
            </Box>
          )}
          <PositionPercentageSlider
            totalValue={formatCurrency(positionEquity)}
            title={i18n.perps.inputs.amount()}
            progressValue={closeProgress}
            sliderWidth={SLIDER_WIDTH - 8 * 2}
          />
        </Box>

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
              {i18n.perps.deposit.receive()}
            </Text>
            <AnimatedText size="17pt" weight="semibold" color={'labelSecondary'}>
              {receivedAmount}
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
          processingLabel={i18n.perps.close_position.closing()}
          label={i18n.perps.close_position.hold_to_close()}
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
        <Panel innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
          <SheetHandleFixedToTop color={isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR} showBlur={true} top={14} />
          <PanelContent symbol={symbol} />
        </Panel>
      </PanelSheet>
    </PerpsAccentColorContextProvider>
  );
});
