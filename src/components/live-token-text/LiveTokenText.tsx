/* eslint-disable react/jsx-props-no-spreading */
import React, { memo } from 'react';

import { useAnimatedStyle } from 'react-native-reanimated';

import { useLiveTokenSharedValue, type LiveTokenValueOptions } from '@/components/live-token-text/useLiveTokenValue';
import { AnimatedText } from '@/design-system';
import { type AnimatedTextProps } from '@/design-system/components/Text/AnimatedText';
import { type PriceChangeColors } from '@/features/market/ui/utils/priceChangeColors';
import { type ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';

type LiveTokenTextProps = LiveTokenValueOptions &
  Omit<AnimatedTextProps, 'children' | 'ref' | 'selector'> & {
    priceChangeColors?: PriceChangeColors;
  };

/** Displays a live value and requests prices unless autoSubscribe is false. */
export const LiveTokenText = memo(function LiveTokenText({
  tokenId,
  selector,
  format,
  fallback,
  fallbackUpdatedAt,
  autoSubscribe,
  priceChangeColors,
  ...textProps
}: LiveTokenTextProps) {
  const liveValue = useLiveTokenSharedValue({ tokenId, selector, format, fallback, fallbackUpdatedAt, autoSubscribe });

  if (priceChangeColors) {
    return (
      <PriceChangeText {...textProps} priceChangeColors={priceChangeColors}>
        {liveValue}
      </PriceChangeText>
    );
  }

  return <AnimatedText {...textProps}>{liveValue}</AnimatedText>;
});

function PriceChangeText({
  children,
  priceChangeColors,
  style,
  ...textProps
}: Omit<AnimatedTextProps, 'selector'> & { children: ReadOnlySharedValue<string>; priceChangeColors: PriceChangeColors }) {
  const { positive, negative, neutral } = priceChangeColors;

  const textStyle = useAnimatedStyle(() => {
    const change = parseFloat(children.value);
    return { color: change > 0 ? positive : change < 0 ? negative : neutral };
  });

  return (
    <AnimatedText {...textProps} style={style ? [textStyle, style] : textStyle}>
      {children}
    </AnimatedText>
  );
}
