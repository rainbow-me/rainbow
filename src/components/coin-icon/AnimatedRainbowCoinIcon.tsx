import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Network } from '@/networks/types';
import { borders, fonts } from '@/styles';
import { ThemeContextProps } from '@/theme';
import { FallbackIcon as CoinIconTextFallback } from '@/utils';

import { FastFallbackCoinIconImage } from '../asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage';
import { FastChainBadge } from '../asset-list/RecyclerAssetList2/FastComponents/FastCoinBadge';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { DerivedValue, useDerivedValue } from 'react-native-reanimated';
import { AnimatedFastFallbackCoinIconImage } from '../asset-list/RecyclerAssetList2/FastComponents/AnimatedFastFallbackCoinIconImage';

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
  network,
  symbol,
  theme,
  colors,
  ignoreBadge,
}: {
  size?: number;
  icon?: DerivedValue<string | undefined>;
  network: DerivedValue<Network | undefined>;
  symbol: DerivedValue<string | undefined>;
  theme: ThemeContextProps;
  colors?: DerivedValue<TokenColors | undefined>;
  ignoreBadge?: boolean;
}) {
  const fallbackIconColor = useDerivedValue(() => colors?.value?.primary || colors?.value?.fallback || theme.colors.purpleUniswap);

  const shadowColor = useDerivedValue(() =>
    theme.isDarkMode ? theme.colors.shadow : colors?.value?.primary || colors?.value?.fallback || theme.colors.shadow
  );

  const shouldDisplayImage = useDerivedValue(() => !!icon?.value);

  return (
    <View style={sx.container}>
      <AnimatedFastFallbackCoinIconImage icon={icon} shadowColor={shadowColor} shouldDisplay={shouldDisplayImage} theme={theme} size={size}>
        {() => (
          // <CoinIconTextFallback
          //   color={fallbackIconColor}
          //   height={size}
          //   style={fallbackIconStyle(size)}
          //   symbol={symbol}
          //   textStyles={fallbackTextStyles}
          //   width={size}
          // />
          <></>
        )}
      </AnimatedFastFallbackCoinIconImage>

      {/* {!ignoreBadge && network && <FastChainBadge network={network} theme={theme} />} */}
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
