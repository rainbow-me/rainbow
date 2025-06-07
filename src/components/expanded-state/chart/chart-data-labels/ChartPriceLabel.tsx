import React, { useCallback } from 'react';
import { Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { useChartData } from '@/react-native-animated-charts/src';
import { currencyToCompactNotation } from '@/helpers/strings';
import { useDerivedValue } from 'react-native-reanimated';
import { AnimatedNumber } from '@/components/live-token-text/AnimatedNumber';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';

export function ChartPriceLabel({
  defaultValue,
  isNoPriceData,
  priceValue,
}: {
  defaultValue: string;
  isNoPriceData: boolean;
  priceValue: string;
}) {
  const { nativeCurrency } = useAccountSettings();
  const { accentColors, basicAsset } = useExpandedAssetSheetContext();
  const { isActive: isChartGestureActive, originalY: currentChartPrice } = useChartData();

  const formatPrice = useCallback(
    (value: string) => {
      'worklet';
      if (!value) return priceValue;
      return currencyToCompactNotation({ value, currency: nativeCurrency });
    },
    [priceValue, nativeCurrency]
  );

  const liveTokenPrice = useLiveTokenSharedValue({
    tokenId: basicAsset.uniqueId,
    initialValueLastUpdated: 0,
    initialValue: basicAsset.price.value?.toString() ?? '0',
    selector: state => state.price,
  });

  const text = useDerivedValue(() => {
    if (isChartGestureActive.value) {
      return formatPrice(currentChartPrice.value);
    } else {
      return formatPrice(liveTokenPrice.value);
    }
  });

  return isNoPriceData ? (
    <Text color="label" numberOfLines={1} size="23px / 27px (Deprecated)" weight="bold">
      {defaultValue}
    </Text>
  ) : (
    <AnimatedNumber
      value={text}
      size="34pt"
      weight="heavy"
      align="left"
      color="label"
      tabularNumbers
      easingMaskColor={accentColors.background}
      disabled={isChartGestureActive}
    />
  );
}
