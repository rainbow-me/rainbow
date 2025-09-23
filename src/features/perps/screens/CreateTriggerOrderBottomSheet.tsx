import React, { memo, useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AnimatedText, Box, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import { PerpsAccentColorContextProvider, usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { addCommasToNumber, opacityWorklet, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { CurrencyInput, CurrencyInputRef } from '@/components/CurrencyInput';
import { TapToDismiss } from '@/components/DappBrowser/control-panel/ControlPanel';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { safeAreaInsetValues } from '@/utils';
import { KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { PerpMarket, PerpPositionSide, PerpsPosition, TriggerOrderType, TriggerOrderSource } from '@/features/perps/types';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { estimatePnl } from '@/features/perps/utils/estimatePnl';
import {
  getPercentageDifferenceWorklet,
  greaterThanWorklet,
  lessThanOrEqualToWorklet,
  greaterThanOrEqualToWorklet,
  mulWorklet,
  subWorklet,
} from '@/safe-math/SafeMath';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { PerpBottomSheetHeader } from '@/features/perps/components/PerpBottomSheetHeader';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { hyperliquidAccountActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { formatTriggerOrderInput } from '@/features/perps/utils/formatTriggerOrderInput';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import { colors } from '@/styles';
import { abbreviateNumberWorklet } from '@/helpers/utilities';
import { calculateIsolatedLiquidationPriceFromMargin } from '@/features/perps/utils/calculateLiquidationPrice';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { logger, RainbowError } from '@/logger';

const PANEL_HEIGHT = 360;
const PRICE_SHIFT_FACTOR = 0.05;

function formatInputForDisplay(value: string) {
  'worklet';
  const numericValue = stripNonDecimalNumbers(value);
  if (!numericValue || numericValue === '0') {
    return '$0';
  }
  return `$${addCommasToNumber(numericValue, '0')}`;
}

function PanelSheet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.panelContainer}>
      <TapToDismiss />
      {children}
    </View>
  );
}

type PanelContentProps = {
  triggerOrderType: TriggerOrderType;
  market: PerpMarket;
  source: TriggerOrderSource;
  position?: PerpsPosition;
};

function PanelContent({ triggerOrderType, market, source, position }: PanelContentProps) {
  const { isDarkMode } = useColorMode();
  const navigation = useNavigation();
  const inputRef = useRef<CurrencyInputRef>(null);
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const { accentColors } = usePerpsAccentColorContext();
  const newPositionAmount = useHlNewPositionStore(state => state.amount);
  const newPositionLeverage = useHlNewPositionStore(state => state.leverage);
  const newPositionSide = useHlNewPositionStore(state => state.positionSide);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTakeProfit = triggerOrderType === TriggerOrderType.TAKE_PROFIT;
  const isStopLoss = triggerOrderType === TriggerOrderType.STOP_LOSS;

  const isExistingPosition = source === TriggerOrderSource.EXISTING && !!position;
  const positionSide = isExistingPosition ? position.side : newPositionSide;
  const leverage = isExistingPosition ? position.leverage : newPositionLeverage;
  const amount = isExistingPosition ? position.marginUsed : newPositionAmount;
  const existingLiquidationPrice = isExistingPosition && position.liquidationPrice ? position.liquidationPrice : '0';

  const isLong = positionSide === PerpPositionSide.LONG;
  const shouldBeAbove = isLong ? isTakeProfit : !isTakeProfit;
  const formatInput = useCallback((text: string) => formatTriggerOrderInput(text, market.decimals), [market.decimals]);
  const initialPrice = mulWorklet(market.price, shouldBeAbove ? 1 + PRICE_SHIFT_FACTOR : 1 - PRICE_SHIFT_FACTOR);
  const inputValue = useSharedValue(formatInput(initialPrice));

  const liveTokenPrice = useLiveTokenSharedValue({
    tokenId: getHyperliquidTokenId(market.symbol),
    initialValue: market.price,
    selector: state => state.price,
  });

  const liquidationPrice = useDerivedValue(() => {
    if (isExistingPosition) {
      return Number(existingLiquidationPrice);
    }

    if (!leverage || !amount) return 0;

    const liquidationPrice = calculateIsolatedLiquidationPriceFromMargin({
      entryPrice: liveTokenPrice.value,
      marginAmount: amount,
      positionSide: positionSide,
      leverage: leverage,
      market,
    });

    return Number(liquidationPrice);
  });

  const targetPriceDifferential = useDerivedValue(() => {
    const targetPrice = inputValue.value === '' ? '0' : inputValue.value;
    return getPercentageDifferenceWorklet(liveTokenPrice.value, targetPrice);
  });

  const isOutOfCurrentPriceBounds = useDerivedValue(() => {
    const isTargetPriceAboveCurrentPrice = greaterThanWorklet(targetPriceDifferential.value, '0');

    if (isLong) {
      if ((isTakeProfit && !isTargetPriceAboveCurrentPrice) || (!isTakeProfit && isTargetPriceAboveCurrentPrice)) return true;
    } else {
      if ((isTakeProfit && isTargetPriceAboveCurrentPrice) || (!isTakeProfit && !isTargetPriceAboveCurrentPrice)) return true;
    }
    return false;
  });

  const isOutOfLiquidationPriceBounds = useDerivedValue(() => {
    if (!isStopLoss || liquidationPrice.value === 0) return false;
    const targetPrice = inputValue.value === '' ? '0' : inputValue.value;

    if (isLong) {
      return lessThanOrEqualToWorklet(targetPrice, liquidationPrice.value);
    } else {
      return greaterThanOrEqualToWorklet(targetPrice, liquidationPrice.value);
    }
  });

  const isValidTargetPrice = useDerivedValue(() => {
    return !isOutOfCurrentPriceBounds.value && !isOutOfLiquidationPriceBounds.value;
  });

  const isValidTargetPriceState = useSharedValueState(isValidTargetPrice, { initialValue: true });

  const projectedPnl = useDerivedValue(() => {
    if (!isValidTargetPrice.value || inputValue.value === '') return '-';

    const targetPrice = inputValue.value;

    if (isExistingPosition) {
      const priceDifference = isLong ? subWorklet(targetPrice, position.entryPrice) : subWorklet(position.entryPrice, targetPrice);
      const pnl = mulWorklet(position.size, priceDifference);
      return formatCurrency(pnl);
    }

    if (!leverage) return '-';

    const projectedPnlValue = estimatePnl({
      entryPrice: liveTokenPrice.value,
      exitPrice: targetPrice,
      margin: amount,
      leverage: String(leverage),
      isLong,
      // We don't include fees because it can be confusing for the user to see a negative projected PnL despite setting a price higher/lower than the current price
      includeFees: false,
    });
    return formatCurrency(projectedPnlValue);
  });

  const targetPriceDifferentialLabelStyle = useAnimatedStyle(() => {
    return {
      color: !isValidTargetPrice.value ? red : greaterThanWorklet(targetPriceDifferential.value, '0') ? green : red,
    };
  });

  const targetPriceDifferentialLabel = useDerivedValue(() => {
    if (!isValidTargetPrice.value) return '􀇿';
    const isAbove = greaterThanWorklet(targetPriceDifferential.value, '0');
    const displayValue = abbreviateNumberWorklet(Number(targetPriceDifferential.value), 2);
    return `${isAbove ? '+' : ''}${displayValue}%`;
  });

  const targetPriceDifferentialLabelSecondary = useDerivedValue(() => {
    const shouldBeAbove = isLong ? isTakeProfit : !isTakeProfit;

    if (!isValidTargetPrice.value) {
      if (isOutOfLiquidationPriceBounds.value && liquidationPrice.value > 0) {
        const liquidationDirection = isLong ? 'above' : 'below';
        return `Must be ${liquidationDirection} liq. price (${formatPerpAssetPrice(String(liquidationPrice.value))})`;
      }
      const direction = shouldBeAbove ? 'above' : 'below';
      return `Must be ${direction} ${formatPerpAssetPrice(liveTokenPrice.value.toString())}`;
    }

    return `${shouldBeAbove ? 'above' : 'below'} current price`;
  });

  const isAddDisabled = !isValidTargetPriceState || isSubmitting;

  const addTriggerOrder = useCallback(async () => {
    if (!isValidTargetPriceState || inputValue.value === '' || isSubmitting) return;

    const triggerOrderPayload = {
      type: triggerOrderType,
      price: inputValue.value,
      orderFraction: '1',
      isMarket: true,
    } as const;

    if (isExistingPosition) {
      setIsSubmitting(true);
      try {
        await hyperliquidAccountActions.createTriggerOrder({
          symbol: market.symbol,
          triggerOrder: triggerOrderPayload,
        });
        navigation.goBack();
      } catch (error) {
        Alert.alert('Error', 'Failed to create trigger order');
        logger.error(new RainbowError('[CreateTriggerOrderBottomSheet] Failed to create trigger order', error));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      hlNewPositionStoreActions.addTriggerOrder({
        ...triggerOrderPayload,
        localId: (Date.now() + Math.random()).toString(),
      });
      navigation.goBack();
    }
  }, [isValidTargetPriceState, inputValue, isSubmitting, isExistingPosition, triggerOrderType, market.symbol, navigation]);

  return (
    <Box paddingTop={'28px'} alignItems="center" style={{ flex: 1 }}>
      <Box gap={24}>
        <Box paddingHorizontal={'24px'} gap={24}>
          <PerpBottomSheetHeader
            title={triggerOrderType === TriggerOrderType.TAKE_PROFIT ? 'Take Profit' : 'Stop Loss'}
            symbol={market.symbol}
          />
          <Box gap={14}>
            <Box
              flexDirection="row"
              width="full"
              borderWidth={isDarkMode ? 2 : 0}
              borderColor={{ custom: accentColors.opacity6 }}
              borderRadius={28}
              height={66}
              paddingHorizontal={'20px'}
              alignItems="center"
              justifyContent="space-between"
              backgroundColor={accentColors.surfacePrimary}
              shadow={'18px'}
            >
              <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
                {'Price'}
              </Text>
              <CurrencyInput
                autoFocus={true}
                ref={inputRef}
                value={inputValue}
                textColor={accentColors.opacity100}
                placeholderTextColor={accentColors.opacity24}
                formatInput={formatInput}
                formatDisplay={formatInputForDisplay}
                size="30pt"
                weight="bold"
                align="right"
                style={{ width: 200 }}
              />
            </Box>

            <Box paddingHorizontal={'8px'} flexDirection="row" alignItems="center" gap={6}>
              <AnimatedText size="15pt" weight="bold" style={targetPriceDifferentialLabelStyle}>
                {targetPriceDifferentialLabel}
              </AnimatedText>
              <AnimatedText size="15pt" weight="bold" color={'labelQuaternary'}>
                {targetPriceDifferentialLabelSecondary}
              </AnimatedText>
            </Box>
          </Box>
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            backgroundColor={opacityWorklet(ETH_COLOR_DARK, 0.03)}
            borderWidth={THICK_BORDER_WIDTH}
            borderColor={'buttonStroke'}
            borderRadius={14}
            padding={'12px'}
          >
            <Text size="17pt" weight="medium" color={'labelSecondary'}>
              {`${isTakeProfit ? 'Projected Profit' : 'Projected Loss'}`}
            </Text>
            <AnimatedText size="17pt" weight="semibold" color={'labelSecondary'} align="right" numberOfLines={1} style={{ width: '50%' }}>
              {projectedPnl}
            </AnimatedText>
          </Box>
        </Box>
        <Box
          paddingHorizontal={{ custom: 18 }}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          width="full"
          gap={12}
        >
          <ButtonPressAnimation
            onPress={() => {
              navigation.goBack();
            }}
            style={{ flex: 1 }}
          >
            <Box
              height={48}
              borderRadius={24}
              backgroundColor={opacityWorklet('#F5F8FF', 0.06)}
              borderWidth={2}
              borderColor={'buttonStroke'}
              justifyContent="center"
              alignItems="center"
            >
              <Text size="20pt" weight="bold" color={'labelTertiary'}>
                {'Cancel'}
              </Text>
            </Box>
          </ButtonPressAnimation>
          <HyperliquidButton
            onPress={addTriggerOrder}
            buttonProps={{ style: { flex: 1, opacity: isAddDisabled ? 0.5 : 1 }, disabled: isAddDisabled }}
          >
            <Text size="20pt" weight="black" color={isDarkMode ? 'black' : 'white'}>
              {isSubmitting ? 'Adding...' : 'Add'}
            </Text>
          </HyperliquidButton>
        </Box>
      </Box>
    </Box>
  );
}

export const CreateTriggerOrderBottomSheet = memo(function CreateTriggerOrderBottomSheet() {
  const {
    params: { triggerOrderType, symbol, source },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET>>();
  const { isDarkMode } = useColorMode();
  const separatorSecondaryColor = useForegroundColor('separatorSecondary');

  const market = useHyperliquidMarketsStore(state => state.getMarket(symbol));
  const position = useHyperliquidAccountStore(state => state.getPosition(symbol));
  const resolvedSource: TriggerOrderSource = source ?? (position ? TriggerOrderSource.EXISTING : TriggerOrderSource.NEW);

  return (
    <KeyboardProvider>
      <PerpsAccentColorContextProvider>
        <PanelSheet>
          <KeyboardStickyView>
            <Panel height={PANEL_HEIGHT} innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
              <SheetHandleFixedToTop color={isDarkMode ? opacityWorklet('#F5F8FF', 0.3) : colors.blueGreyDark30} showBlur={true} top={14} />
              {/* The market should always be defined */}
              {market && <PanelContent triggerOrderType={triggerOrderType} market={market} source={resolvedSource} position={position} />}
            </Panel>
          </KeyboardStickyView>
        </PanelSheet>
      </PerpsAccentColorContextProvider>
    </KeyboardProvider>
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
