import React from 'react';
import { StyleSheet, View } from 'react-native';
import { borders, fonts } from '@/styles';
import { ThemeContextProps } from '@/theme';
import { FallbackIcon as CoinIconTextFallback } from '@/utils';

import { FastFallbackCoinIconImage } from '../asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage';
import { FastChainBadge } from '../asset-list/RecyclerAssetList2/FastComponents/FastCoinBadge';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { ChainId } from '@/chains/types';

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const fallbackIconStyle = (size: number) => ({
  ...borders.buildCircleAsObject(size),
  position: 'absolute',
});

export default React.memo(function RainbowCoinIcon({
  size = 40,
  icon,
  chainId,
  symbol,
  theme,
  colors,
  ignoreBadge,
}: {
  size?: number;
  icon?: string;
  chainId: ChainId;
  symbol: string;
  theme: ThemeContextProps;
  colors?: TokenColors;
  ignoreBadge?: boolean;
}) {
  const fallbackIconColor = colors?.primary || colors?.fallback || theme.colors.purpleUniswap;

  const shadowColor = theme.isDarkMode ? theme.colors.shadow : colors?.primary || colors?.fallback || theme.colors.shadow;

  return (
    <View style={sx.container}>
      <FastFallbackCoinIconImage icon={icon} shadowColor={shadowColor} symbol={symbol} theme={theme} size={size}>
        {() => (
          <CoinIconTextFallback
            color={fallbackIconColor}
            height={size}
            style={fallbackIconStyle(size)}
            symbol={symbol}
            textStyles={fallbackTextStyles}
            width={size}
          />
        )}
      </FastFallbackCoinIconImage>

      {!ignoreBadge && chainId && <FastChainBadge chainId={chainId} theme={theme} />}
    </View>
  );
});

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
