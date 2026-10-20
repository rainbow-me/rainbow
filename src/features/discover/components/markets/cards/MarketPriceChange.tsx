import React, { memo } from 'react';

import { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { AnimatedText } from '@/design-system';
import { type TextSize } from '@/design-system/components/Text/Text';
import { DOWN_ARROW, formatNormalizedPercentChange, UP_ARROW } from '@/features/market/ui/utils/formatPriceChange';
import { getPriceChangeColor, type PriceChangeColors } from '@/features/market/ui/utils/priceChangeColors';
import { type ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';

type MarketPriceChangeProps = {
  arrowHeight: number;
  arrowSize: TextSize;
  arrowWidth: number;
  colorSharedValue?: SharedValue<string>;
  priceChange: ReadOnlySharedValue<string>;
  priceChangeColors: PriceChangeColors;
  textSize: TextSize;
};

export const MarketPriceChange = memo(function MarketPriceChange({
  arrowHeight,
  arrowSize,
  arrowWidth,
  colorSharedValue,
  priceChange,
  priceChangeColors,
  textSize,
}: MarketPriceChangeProps) {
  const priceChangeStyle = useAnimatedStyle(() => ({
    color: colorSharedValue?.value ?? getPriceChangeColor(priceChange.value, priceChangeColors),
  }));

  return (
    <>
      <AnimatedTextIcon
        containerSize={arrowWidth}
        height={arrowHeight}
        selector={selectPriceChangeArrow}
        size={arrowSize}
        textStyle={priceChangeStyle}
        weight="heavy"
        width={arrowWidth}
      >
        {priceChange}
      </AnimatedTextIcon>

      <AnimatedText numberOfLines={1} selector={selectPriceChangeText} size={textSize} style={priceChangeStyle} weight="bold">
        {priceChange}
      </AnimatedText>
    </>
  );
});

function selectPriceChangeArrow(priceChange: SharedValue<string>): string {
  'worklet';
  return Number(priceChange.value) >= 0 ? UP_ARROW : DOWN_ARROW;
}

function selectPriceChangeText(priceChange: SharedValue<string>): string {
  'worklet';
  return formatNormalizedPercentChange(priceChange.value);
}
