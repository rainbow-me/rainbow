import React from 'react';
import { Animated, StyleSheet, TextStyle } from 'react-native';
import { borders, fonts } from '@/styles';
import { ThemeContextProps } from '@/theme';

import { TokenColors } from '@/graphql/__generated__/metadata';
import { AnimatedCoinIconImage } from '../asset-list/RecyclerAssetList2/FastComponents/AnimatedCoinIconImage';
import { DerivedValue, StyleProps, useDerivedValue } from 'react-native-reanimated';

import { ImageOptions } from '@candlefinance/faster-image';
import { AnimatedChainBadge } from '../asset-list/RecyclerAssetList2/FastComponents/AnimatedCoinBadge';

import AnimatedFallbackIcon from './AnimatedFallbackIcon';
import { ChainId } from '@/__swaps__/types/chains';

const fallbackTextStyles: TextStyle = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold as any,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const fallbackIconStyle = (size: number): TextStyle => ({
  ...borders.buildCircleAsObject(size),
  position: 'absolute',
});

export default function AnimatedRainbowCoinIcon({
  size = 40,
  icon,
  chainId,
  symbol,
  fallbackColor,
  theme,
  colors,
  ignoreBadge,
  badgeXPosition,
  badgeYPosition,
  style,
}: {
  fallbackColor?: DerivedValue<string>;
  style?: StyleProps;
  size?: number;
  icon: DerivedValue<string>;
  chainId: DerivedValue<ChainId>;
  symbol: DerivedValue<string>;
  theme: ThemeContextProps;
  colors?: DerivedValue<TokenColors>;
  ignoreBadge?: boolean;
  badgeXPosition?: number;
  badgeYPosition?: number;
}) {
  const source = useDerivedValue(() => {
    return {
      url: icon.value,
    } as ImageOptions;
  });
  const tokenSymbol = useDerivedValue(() => {
    return symbol.value;
  });

  const fallbackIconColor = useDerivedValue(() => {
    return colors?.value?.primary || colors?.value?.fallback || fallbackColor?.value || '';
  });

  const shadowColor = useDerivedValue(() => {
    return theme.isDarkMode
      ? theme.colors.shadow
      : colors?.value?.primary || colors?.value?.fallback || fallbackColor?.value || theme.colors.shadow;
  });

  const chainIdValue = useDerivedValue(() => {
    return chainId?.value;
  });

  return (
    <Animated.View style={[sx.container, style]}>
      <AnimatedCoinIconImage source={source} shadowColor={shadowColor.value} symbol={tokenSymbol.value} theme={theme} size={size}>
        {() => (
          <AnimatedFallbackIcon
            color={fallbackIconColor}
            height={size}
            style={fallbackIconStyle(size)}
            symbol={tokenSymbol}
            textStyles={fallbackTextStyles}
            width={size}
          />
        )}
      </AnimatedCoinIconImage>

      {!ignoreBadge && <AnimatedChainBadge chainId={chainIdValue} theme={theme} />}
    </Animated.View>
  );
}

const sx = StyleSheet.create({
  container: {
    elevation: 6,
    overflow: 'visible',
  },
  reactCoinIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  withShadow: {
    elevation: 6,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
