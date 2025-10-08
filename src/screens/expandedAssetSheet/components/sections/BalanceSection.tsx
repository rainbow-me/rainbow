import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { AnimatedText, Box, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { SheetSeparator } from '../shared/Separator';
import Animated, { useDerivedValue, useAnimatedStyle, DerivedValue } from 'react-native-reanimated';
import { LAYOUT_ANIMATION } from '../shared/CollapsibleSection';
import { useLiveTokenSharedValue, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { useAccountSettings } from '@/hooks';
import { AnimatedNumber } from '@/components/animated-number/AnimatedNumber';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { useCandlestickPrice } from '@/features/charts/stores/derived/useCandlestickPrice';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { greaterThanWorklet, mulWorklet } from '@/safe-math/SafeMath';
import { arePricesEqual } from '@/features/charts/candlestick/utils';
import { useChartType } from '@/features/charts/stores/chartsStore';
import { ChartType } from '@/features/charts/types';
import { useListenerRouteGuard } from '@/state/internal/hooks/useListenerRouteGuard';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

export function BalanceSection() {
  const { accentColors, accountAsset: asset, isOwnedAsset } = useExpandedAssetSheetContext();
  const { nativeCurrency } = useAccountSettings();
  const chartType = useChartType();

  const balanceAmount = asset?.balance?.amount ?? '0';
  const tokenId = asset?.uniqueId ?? '';

  const liveTokenPrice = useLiveTokenSharedValue({
    tokenId,
    initialValue: asset?.native?.price?.amount ?? '0',
    initialValueLastUpdated: asset?.price?.changed_at ?? 0,
    selector: token => token.price,
  });

  const liveTokenLiquidityCap = useLiveTokenValue({
    tokenId,
    initialValue: '',
    selector: token => token.reliability.metadata.liquidityCap,
  });

  const [currentCandlestickPrice, candlestickPriceListener] = useStoreSharedValue(useCandlestickPrice, state => state, {
    equalityFn: arePricesEqual,
    returnListenHandle: true,
  });

  useListenerRouteGuard(candlestickPriceListener);

  const tokenBalanceData = useDerivedValue(() => {
    const priceToUse =
      chartType === ChartType.Candlestick ? currentCandlestickPrice.value?.price ?? liveTokenPrice.value : liveTokenPrice.value;

    if (!priceToUse) {
      return { displayValue: liveTokenPrice.value, isCapped: false, uncappedValue: liveTokenPrice.value };
    }

    const balanceValue = mulWorklet(balanceAmount, priceToUse);
    const uncappedDisplay = convertAmountToNativeDisplayWorklet(balanceValue, nativeCurrency);

    if (liveTokenLiquidityCap !== '' && greaterThanWorklet(balanceValue, liveTokenLiquidityCap)) {
      return {
        displayValue: convertAmountToNativeDisplayWorklet(liveTokenLiquidityCap, nativeCurrency),
        isCapped: true,
        uncappedValue: uncappedDisplay,
      };
    }

    return { displayValue: uncappedDisplay, isCapped: false, uncappedValue: uncappedDisplay };
  });

  // TODO: must do this for the `AnimatedNumber` masking to work properly. However, this means this card will be very slightly a different color than the other cards. It's generally imperceptible, but we should use this background color for all the cards
  const backgroundColor = useMemo(
    () => getSolidColorEquivalent({ foreground: accentColors.color, background: accentColors.background, opacity: 0.06 }),
    [accentColors]
  );

  const liquidityCapDisclaimerStyle = useAnimatedStyle(() => ({
    display: tokenBalanceData.value.isCapped ? 'flex' : 'none',
  }));

  const balanceDisplayValue = useDerivedValue(() => {
    return tokenBalanceData.value.displayValue;
  });

  if (!isOwnedAsset || !asset?.balance || !asset?.native?.balance) return null;

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <Box gap={12}>
        <Box
          backgroundColor={accentColors.opacity6}
          borderColor={{ custom: accentColors.opacity6 }}
          borderRadius={20}
          borderWidth={1}
          gap={12}
          padding="16px"
        >
          <Box flexDirection="row" justifyContent="space-between">
            <Text color="labelTertiary" size="15pt" weight="bold">
              {i18n.t(i18n.l.expanded_state.asset.balance)}
            </Text>
            <Text color="labelTertiary" size="15pt" weight="bold" align="right">
              {i18n.t(i18n.l.expanded_state.asset.value)}
            </Text>
          </Box>
          <Box alignItems="center" width="full" gap={8} flexDirection="row" justifyContent="flex-start">
            <RainbowCoinIcon
              size={20}
              chainId={asset.chainId}
              color={asset.color}
              icon={asset.icon_url}
              showBadge={false}
              symbol={asset.symbol}
            />
            <TextShadow blur={12} containerStyle={{ flex: 1 }} shadowOpacity={0.24}>
              <Text numberOfLines={1} ellipsizeMode="tail" weight="bold" size="20pt" color={'accent'}>
                {asset.balance.display}
              </Text>
            </TextShadow>
            <AnimatedNumber
              value={balanceDisplayValue}
              easingMaskColor={backgroundColor}
              color="label"
              numberOfLines={1}
              size="20pt"
              weight="heavy"
              align="right"
              tabularNumbers
            />
          </Box>
        </Box>
        <Animated.View style={liquidityCapDisclaimerStyle}>
          <Box paddingHorizontal="16px" flexDirection="row" gap={2}>
            <Text align="center" color="labelTertiary" size="13pt" weight="bold">
              {i18n.t(i18n.l.expanded_state.asset.liquidity_cap_disclaimer.value_lower_than)}
            </Text>
            <AnimatedText selector={uncappedValueSelector} align="center" color="labelTertiary" size="13pt" weight="heavy">
              {tokenBalanceData}
            </AnimatedText>
            <Text align="center" color="labelTertiary" size="13pt" weight="bold">
              {i18n.t(i18n.l.expanded_state.asset.liquidity_cap_disclaimer.due_to_low_liquidity)}
            </Text>
          </Box>
        </Animated.View>
      </Box>
      <SheetSeparator />
    </Box>
  );
}

function uncappedValueSelector(
  tokenBalanceData: DerivedValue<{
    uncappedValue: string;
    isCapped: boolean;
    displayValue: string;
  }>
) {
  'worklet';
  return tokenBalanceData.value.uncappedValue;
}
