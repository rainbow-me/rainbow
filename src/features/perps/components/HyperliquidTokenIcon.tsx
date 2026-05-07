import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { ImgixImage } from '@/components/images';
import { type ImgixImageProps } from '@/components/images/ImgixImage';
import { globalColors, Text, useForegroundColor } from '@/design-system';
import { hyperliquidMarketsActions, useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';

type HyperliquidTokenIconProps = Omit<ImgixImageProps, 'source'> & {
  size: number;
  symbol: string;
};

export const HyperliquidTokenIcon = memo(function HyperliquidTokenIcon({ size, style, symbol }: HyperliquidTokenIconProps) {
  const fallbackColor = useForegroundColor('accent');
  const iconUrl = useHyperliquidMarketsStore(state => state.getCoinIcon(symbol));
  const color = useMemo(() => (iconUrl ? undefined : hyperliquidMarketsActions.getColor(symbol)), [iconUrl, symbol]);
  const baseSymbol = useMemo(() => extractBaseSymbol(symbol), [symbol]);
  const iconBackgroundColor = useMemo(() => getIconBackgroundColor(baseSymbol), [baseSymbol]);

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

  if (!iconUrl) {
    return (
      <View style={[containerStyle, { backgroundColor: color || fallbackColor }]}>
        <Text align="center" size="icon 8px" weight="heavy" color="label">
          {size >= 36 ? baseSymbol : baseSymbol.slice(0, 1)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[containerStyle, iconBackgroundColor ? { backgroundColor: iconBackgroundColor } : null]}>
      <ImgixImage
        enableFasterImage
        size={size}
        source={{ uri: iconUrl }}
        style={style ? [style, { height: size, width: size }] : { height: size, width: size }}
      />
    </View>
  );
});

function getIconBackgroundColor(baseSymbol: string): string | undefined {
  // The MEGA hosted icon is a dark transparent asset, so it needs the missing light disc on dark Perps surfaces.
  return baseSymbol === 'MEGA' ? globalColors.white100 : undefined;
}
