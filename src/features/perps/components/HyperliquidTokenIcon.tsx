import React, { memo, useMemo } from 'react';
import { RainbowImage, RainbowImageProps } from '@/components/RainbowImage';
import { Text, useForegroundColor } from '@/design-system';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { View } from 'react-native';

type HyperliquidTokenIconProps = Omit<RainbowImageProps, 'source'> & {
  size: number;
  symbol: string;
};

export const HyperliquidTokenIcon = memo(function HyperliquidTokenIcon({ symbol, size, ...props }: HyperliquidTokenIconProps) {
  const fallbackColor = useForegroundColor('accent');
  const market = useHyperliquidMarketsStore(state => state.getMarket(symbol));
  const containerStyle = useMemo(() => {
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    } as const;
  }, [size]);

  if (!market || !market.metadata?.iconUrl) {
    const color = market?.metadata?.colors.color ?? fallbackColor;
    return (
      <View style={[containerStyle, { backgroundColor: color }]}>
        <Text size="icon 8px" weight="bold" color="label">
          {symbol}
        </Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <RainbowImage source={{ url: market.metadata.iconUrl }} style={{ width: size, height: size, ...(props.style ?? {}) }} />
    </View>
  );
});
