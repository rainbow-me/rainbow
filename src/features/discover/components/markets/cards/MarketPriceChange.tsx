import React, { memo } from 'react';

import { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { AnimatedText } from '@/design-system';
import { type TextSize } from '@/design-system/components/Text/Text';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { toFixedWorklet } from '@/framework/core/safeMath';
import { getPriceChangeColor, type PriceChangeColors } from '@/framework/ui/price/usePriceChangeColors';
import { type TokenData } from '@/state/liveTokens/types';

type MarketPriceChangeProps = {
  arrowHeight: number;
  arrowSize: TextSize;
  arrowWidth: number;
  colorSharedValue?: SharedValue<string>;
  initialPriceChange: string;
  priceChangeColors: PriceChangeColors;
  priceChangeSelector: (token: TokenData) => string;
  textSize: TextSize;
  tokenId: string;
};

export const MarketPriceChange = memo(function MarketPriceChange({
  arrowHeight,
  arrowSize,
  arrowWidth,
  colorSharedValue,
  initialPriceChange,
  priceChangeColors,
  priceChangeSelector,
  textSize,
  tokenId,
}: MarketPriceChangeProps) {
  const livePriceChange = useLiveTokenSharedValue({
    initialValue: initialPriceChange,
    selector: priceChangeSelector,
    tokenId,
  });

  const priceChangeStyle = useAnimatedStyle(() => ({
    color: colorSharedValue?.value ?? getPriceChangeColor(livePriceChange.value, priceChangeColors),
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
        {livePriceChange}
      </AnimatedTextIcon>

      <AnimatedText numberOfLines={1} selector={selectPriceChangeText} size={textSize} style={priceChangeStyle} weight="bold">
        {livePriceChange}
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
  return `${toFixedWorklet(Math.abs(Number(priceChange.value)) * 10_000, 2)}%`;
}
