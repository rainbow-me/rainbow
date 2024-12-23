import React from 'react';
import { StyleSheet, View } from 'react-native';
import { borders, fonts } from '@/styles';
import { useTheme } from '@/theme';
import { FallbackIcon as CoinIconTextFallback } from '@/utils';

import { FastFallbackCoinIconImage } from '../asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage';
import { ChainId } from '@/state/backendNetworks/types';
import { ChainImage } from './ChainImage';
import { globalColors } from '@/design-system/color/palettes';

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
  forceDarkMode,
  color,
  showBadge = chainId !== ChainId.mainnet,
  chainSize = (size * 1.5) / 2,
  chainBadgePosition = {},
}: {
  size?: number;
  icon?: string;
  chainId: ChainId;
  symbol: string;
  forceDarkMode?: boolean;
  color?: string;
  showBadge?: boolean;
  chainSize?: number;
  chainBadgePosition?: {
    x?: number;
    y?: number;
  };
}) {
  const theme = useTheme();
  const fallbackIconColor = color ?? theme.colors.purpleUniswap;
  const shadowColor = theme.isDarkMode || forceDarkMode ? theme.colors.shadow : color || fallbackIconColor;

  return (
    <View style={[sx.container, { height: size }]}>
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

      <ChainImage
        showBadge={showBadge}
        chainId={chainId}
        size={chainSize}
        badgeXPosition={chainBadgePosition?.x}
        badgeYPosition={chainBadgePosition?.y}
      />
    </View>
  );
});

const sx = StyleSheet.create({
  container: {
    elevation: 6,
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    shadowColor: globalColors.grey100,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowRadius: 6,
    shadowOpacity: 0.2,
  },
});
