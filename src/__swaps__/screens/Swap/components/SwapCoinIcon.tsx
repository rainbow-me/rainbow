/* eslint-disable no-nested-ternary */
import React from 'react';

import { ThemeContextProps } from '@/theme';
import { ethereumUtils } from '@/utils';
import { DerivedValue, StyleProps } from 'react-native-reanimated';
import AnimatedRainbowCoinIcon from '@/components/coin-icon/AnimatedRainbowCoinIcon';
import { TokenColors } from '@/graphql/__generated__/metadata';

import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { ChainId } from '@/__swaps__/types/chains';

export const SwapCoinIcon = React.memo(function FeedCoinIcon({
  colors,
  iconUrl,
  large,
  chainId,
  fallbackColor,
  small,
  symbol,
  theme,
}: {
  colors?: TokenColors;
  iconUrl?: string;
  fallbackColor?: string;
  large?: boolean;
  chainId?: ChainId;
  small?: boolean;
  symbol: string;
  theme: ThemeContextProps;
}) {
  return (
    <RainbowCoinIcon
      colors={colors}
      network={ethereumUtils.getNetworkFromChainId(chainId!)}
      fallbackColor={fallbackColor}
      symbol={symbol}
      size={small ? 16 : large ? 36 : 32}
      icon={iconUrl}
      theme={theme}
    />
  );
});

export const AnimatedSwapCoinIcon = React.memo(function FeedCoinIcon({
  iconUrl,
  chainId,
  colors,
  fallbackColor,
  ignoreBadge,
  symbol,
  large,
  small,
  theme,
  style,
}: {
  chainId: DerivedValue<ChainId>;
  symbol: DerivedValue<string>;
  style?: StyleProps;
  colors?: DerivedValue<TokenColors>;
  iconUrl: DerivedValue<string>;
  fallbackColor: DerivedValue<string>;
  ignoreBadge?: boolean;
  disableShadow?: boolean;
  forceDarkMode?: boolean;
  large?: boolean;
  mainnetAddress?: string;
  small?: boolean;
  theme: ThemeContextProps;
}) {
  return (
    <AnimatedRainbowCoinIcon
      colors={colors}
      chainId={chainId}
      symbol={symbol}
      size={small ? 16 : large ? 36 : 32}
      fallbackColor={fallbackColor}
      icon={iconUrl}
      style={style}
      theme={theme}
      ignoreBadge={ignoreBadge}
    />
  );
});
