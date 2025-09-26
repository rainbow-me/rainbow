import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { Text, useForegroundColor } from '@/design-system';
import { hyperliquidMarketsActions, useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { ImgixImage } from '@/components/images';
import { ImgixImageProps } from '@/components/images/ImgixImage';

type HyperliquidTokenIconProps = Omit<ImgixImageProps, 'source'> & {
  size: number;
  symbol: string;
};

export const HyperliquidTokenIcon = memo(function HyperliquidTokenIcon({ size, style, symbol }: HyperliquidTokenIconProps) {
  const fallbackColor = useForegroundColor('accent');
  const iconUrl = useHyperliquidMarketsStore(state => state.getCoinIcon(symbol));
  const color = useMemo(() => (iconUrl ? undefined : hyperliquidMarketsActions.getColor(symbol)), [iconUrl, symbol]);

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
          {size >= 36 ? symbol : symbol.slice(0, 1)}
        </Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ImgixImage
        enableFasterImage
        size={size}
        source={{ uri: iconUrl }}
        style={style ? [style, { height: size, width: size }] : { height: size, width: size }}
      />
    </View>
  );
});
