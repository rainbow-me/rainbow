import React, { memo, useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedText, Box, Separator, Text, useForegroundColor } from '@/design-system';
import { PerpsAccentColorContextProvider, usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { addCommasToNumber, opacityWorklet, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { CurrencyInput, CurrencyInputRef } from '@/components/CurrencyInput';
import { TapToDismiss } from '@/components/DappBrowser/control-panel/ControlPanel';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { safeAreaInsetValues } from '@/utils';
import { KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { PerpMarket, PerpPositionSide, TriggerOrderType } from '@/features/perps/types';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { LiveTokenText, useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { estimatePnl } from '@/features/perps/utils/estimatePnl';
import { getPercentageDifferenceWorklet, greaterThanWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';

const PANEL_HEIGHT = 375;

// TODO (kane): centralize this formatting
function formatInput(text: string) {
  'worklet';
  const cleanedText = text.replace(/[^0-9.]/g, '');

  if (!cleanedText) return '';

  // Handle multiple decimals - keep only the first one
  const parts = cleanedText.split('.');
  let formattedText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanedText;

  // Handle decimal point
  if (formattedText.includes('.')) {
    const [intPart, decPart] = formattedText.split('.');
    // Allow empty integer part (will be displayed as "0.")
    const cleanedInt = intPart === '' ? '0' : intPart.replace(/^0+/, '') || '0';
    // Limit decimal places to 2
    const truncatedDecPart = decPart.slice(0, 2);
    formattedText = `${cleanedInt}.${truncatedDecPart}`;
  } else {
    // No decimal point - only strip leading zeros if there's more than one character
    // This allows "0" to remain but "00" becomes "0", "05" becomes "5"
    if (formattedText.length > 1) {
      formattedText = formattedText.replace(/^0+/, '') || '0';
    }
  }

  return formattedText;
}

function formatDisplay(value: string) {
  'worklet';
  const numericValue = stripNonDecimalNumbers(value);
  if (!numericValue || numericValue === '0') {
    return '0';
  }
  return addCommasToNumber(numericValue, '0') as string;
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
};

function PanelContent({ triggerOrderType, market }: PanelContentProps) {
  const navigation = useNavigation();
  const inputRef = useRef<CurrencyInputRef>(null);
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const { accentColors } = usePerpsAccentColorContext();
  const amount = useHlNewPositionStore(state => state.amount);
  const leverage = useHlNewPositionStore(state => state.leverage);
  const positionSide = useHlNewPositionStore(state => state.positionSide);
  const isTakeProfit = triggerOrderType === TriggerOrderType.TAKE_PROFIT;
  const isLong = positionSide === PerpPositionSide.LONG;
  const initialAmount = formatInput(formatDisplay(mulWorklet(market.price, isLong ? 1.1 : 0.9)));
  const inputValue = useSharedValue(initialAmount);

  const liveTokenPrice = useLiveTokenSharedValue({
    tokenId: getHyperliquidTokenId(market.symbol),
    initialValue: market.price,
    selector: state => state.price,
  });

  const targetPriceDifferential = useDerivedValue(() => {
    const targetPrice = inputValue.value === '' ? '0' : inputValue.value;
    return getPercentageDifferenceWorklet(liveTokenPrice.value, targetPrice);
  });

  const isValidTargetPrice = useDerivedValue(() => {
    const isTargetPriceAboveCurrentPrice = greaterThanWorklet(targetPriceDifferential.value, '0');
    if ((isTakeProfit && !isTargetPriceAboveCurrentPrice) || (!isTakeProfit && isTargetPriceAboveCurrentPrice)) return false;
    return true;
  });

  const projectedPnl = useDerivedValue(() => {
    if (!isValidTargetPrice.value || inputValue.value === '' || !leverage) return '-';
    const projectedPnl = estimatePnl({
      entryPrice: liveTokenPrice.value,
      exitPrice: inputValue.value,
      margin: amount,
      leverage: String(leverage),
      isLong,
      isMakerOrder: isTakeProfit,
    });
    return formatAssetPrice({ value: projectedPnl, currency: 'USD' });
  });

  const targetPriceDifferentialLabelStyle = useAnimatedStyle(() => {
    return {
      color: !isValidTargetPrice.value ? red : isTakeProfit ? green : red,
    };
  });

  const targetPriceDifferentialLabel = useDerivedValue(() => {
    if (!isValidTargetPrice.value) return '􀇿';
    return `${isTakeProfit ? '+' : ''}${toFixedWorklet(targetPriceDifferential.value, 2)}%`;
  });

  const targetPriceDifferentialLabelSecondary = useDerivedValue(() => {
    if (isTakeProfit && !isValidTargetPrice.value)
      return `must be above ${formatAssetPrice({ value: liveTokenPrice.value, currency: 'USD' })}`;
    if (!isTakeProfit && !isValidTargetPrice.value)
      return `must be below ${formatAssetPrice({ value: liveTokenPrice.value, currency: 'USD' })}`;
    return `${isTakeProfit ? 'above' : 'below'} current price`;
  });

  const addTriggerOrder = useCallback(() => {
    hlNewPositionStoreActions.addTriggerOrder({
      type: triggerOrderType,
      price: inputValue.value,
      // We currently only support 100% of the order size for trigger orders
      orderFraction: '1',
      isMarket: true,
      localId: (Date.now() + Math.random()).toString(),
    });
    navigation.goBack();
  }, [triggerOrderType, inputValue, navigation]);

  return (
    <Box paddingHorizontal={'24px'} paddingTop={'28px'} alignItems="center" style={{ flex: 1 }}>
      <Box gap={24}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="full">
          <Text size="20pt" weight="heavy" color={'label'}>
            {triggerOrderType === TriggerOrderType.TAKE_PROFIT ? 'Take Profit' : 'Stop Loss'}
          </Text>
          <Box gap={12}>
            <Text size="15pt" weight="bold" color={'labelQuaternary'}>
              {'Current Price'}
            </Text>
            <Box flexDirection="row" alignItems="center" gap={4}>
              <HyperliquidTokenIcon symbol="BTC" style={{ width: 14, height: 14 }} />
              <LiveTokenText
                tokenId={getHyperliquidTokenId(market.symbol)}
                size="15pt"
                weight="heavy"
                color={'labelSecondary'}
                initialValue={market.price}
                selector={token => formatAssetPrice({ value: token.price, currency: 'USD' })}
              />
            </Box>
          </Box>
        </Box>
        <Box
          flexDirection="row"
          width="full"
          borderWidth={2}
          borderColor={{ custom: accentColors.opacity6 }}
          borderRadius={28}
          paddingVertical={'24px'}
          paddingHorizontal={'20px'}
          alignItems="center"
          justifyContent="space-between"
          backgroundColor={accentColors.surfacePrimary}
        >
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {'Price'}
          </Text>
          <CurrencyInput
            autoFocus={true}
            ref={inputRef}
            value={inputValue}
            currencySymbol="$"
            textColor={accentColors.opacity100}
            placeholderTextColor={accentColors.opacity24}
            formatInput={formatInput}
            formatDisplay={formatDisplay}
            size="30pt"
            weight="bold"
            align="right"
          />
        </Box>
        <Box flexDirection="row" alignItems="center" gap={6}>
          <AnimatedText size="15pt" weight="bold" style={targetPriceDifferentialLabelStyle}>
            {targetPriceDifferentialLabel}
          </AnimatedText>
          <AnimatedText size="15pt" weight="bold" color={'labelQuaternary'}>
            {targetPriceDifferentialLabelSecondary}
          </AnimatedText>
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
          <AnimatedText size="17pt" weight="semibold" color={'labelSecondary'}>
            {projectedPnl}
          </AnimatedText>
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="full" gap={12}>
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
          <ButtonPressAnimation onPress={addTriggerOrder} style={{ flex: 1 }}>
            <Box
              height={48}
              borderRadius={24}
              backgroundColor={accentColors.opacity100}
              borderWidth={2}
              borderColor={'buttonStroke'}
              justifyContent="center"
              alignItems="center"
            >
              <Text size="20pt" weight="black" color={{ custom: 'black' }}>
                {'Add'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>
      </Box>
    </Box>
  );
}

export const CreateTriggerOrderBottomSheet = memo(function CreateTriggerOrderBottomSheet() {
  const {
    params: { triggerOrderType, market },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET>>();

  const separatorSecondaryColor = useForegroundColor('separatorSecondary');

  return (
    <KeyboardProvider>
      <PerpsAccentColorContextProvider>
        <PanelSheet>
          <KeyboardStickyView>
            <Panel height={PANEL_HEIGHT} innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
              <PanelContent triggerOrderType={triggerOrderType} market={market} />
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
