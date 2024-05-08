/* eslint-disable no-nested-ternary */
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import EthIcon from '@/assets/eth-icon.png';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { globalColors } from '@/design-system';
import { Network } from '@/networks/types';
import { borders, fonts } from '@/styles';
import { ThemeContextProps } from '@/theme';
import { FallbackIcon as CoinIconTextFallback, isETH } from '@/utils';
import Animated, { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';

// TODO: Delete this and replace with RainbowCoinIcon
// ⚠️ When replacing this component with RainbowCoinIcon, make sure
// ⚠️ to exactly replicate the sizing and shadows defined below

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const fallbackIconStyle = {
  ...borders.buildCircleAsObject(32),
  position: 'absolute',
};

const largeFallbackIconStyle = {
  ...borders.buildCircleAsObject(36),
  position: 'absolute',
};

const smallFallbackIconStyle = {
  ...borders.buildCircleAsObject(16),
  position: 'absolute',
};

/**
 * If mainnet asset is available, get the token under /ethereum/ (token) url.
 * Otherwise let it use whatever type it has
 * @param param0 - optional mainnetAddress, address and network
 * @returns a proper type and address to use for the url
 */
function resolveNetworkAndAddress({ address, mainnetAddress, network }: { mainnetAddress?: string; address: string; network: Network }) {
  if (mainnetAddress) {
    return {
      resolvedAddress: mainnetAddress,
      resolvedNetwork: Network.mainnet,
    };
  }

  return {
    resolvedAddress: address,
    resolvedNetwork: network,
  };
}

export const SwapCoinIcon = React.memo(function FeedCoinIcon({
  address,
  color,
  iconUrl,
  disableShadow,
  forceDarkMode,
  large,
  mainnetAddress,
  network,
  small,
  symbol,
  theme,
}: {
  address: string;
  color?: string;
  iconUrl?: string;
  disableShadow?: boolean;
  forceDarkMode?: boolean;
  large?: boolean;
  mainnetAddress?: string;
  network: Network;
  small?: boolean;
  symbol: string;
  theme: ThemeContextProps;
}) {
  const { colors } = theme;

  const { resolvedAddress } = resolveNetworkAndAddress({
    address,
    mainnetAddress,
    network,
  });

  const fallbackIconColor = color ?? colors.purpleUniswap;
  const shadowColor = theme.isDarkMode || forceDarkMode ? colors.shadow : color || fallbackIconColor;
  const eth = isETH(resolvedAddress);

  const animatedIconSource = useAnimatedProps(() => {
    return {
      source: {
        ...DEFAULT_FASTER_IMAGE_CONFIG,
        url: iconUrl ?? '',
      },
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return { display: iconUrl ? 'flex' : 'none' };
  });

  const fallbackTextStyle = useAnimatedStyle(() => {
    return { display: iconUrl ? 'none' : 'flex' };
  });

  return (
    <View style={small ? sx.containerSmall : large ? sx.containerLarge : sx.container}>
      {eth ? (
        <Animated.View
          style={[
            sx.reactCoinIconContainer,
            small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback,
            small || disableShadow ? {} : sx.withShadow,
            { shadowColor },
          ]}
        >
          <Image source={EthIcon} style={small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback} />
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            sx.reactCoinIconContainer,
            small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback,
            small || disableShadow ? {} : sx.withShadow,
            { shadowColor },
          ]}
        >
          <Animated.View style={[sx.coinIconFallback, fallbackTextStyle]}>
            <CoinIconTextFallback
              color={color}
              height={small ? 16 : large ? 36 : 32}
              style={small ? smallFallbackIconStyle : large ? largeFallbackIconStyle : fallbackIconStyle}
              symbol={symbol}
              textStyles={fallbackTextStyles}
              width={small ? 16 : large ? 36 : 32}
            />
          </Animated.View>

          {/* ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error */}
          {/* @ts-expect-error: Doesn't pick up that its getting a source prop via animatedProps */}
          <AnimatedFasterImage animatedProps={animatedIconSource} style={[animatedIconStyle, sx.iconImage]} />
        </Animated.View>
      )}

      {network && network !== Network.mainnet && !small && (
        <View style={sx.badge}>
          <ChainImage chain={network} size={16} />
        </View>
      )}
    </View>
  );
});

const sx = StyleSheet.create({
  badge: {
    bottom: -0,
    left: -8,
    position: 'absolute',
    shadowColor: globalColors.grey100,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowRadius: 6,
    shadowOpacity: 0.2,
  },
  coinIconFallback: {
    borderRadius: 16,
    height: 32,
    overflow: 'visible',
    width: 32,
  },
  iconImage: {
    height: '100%',
    width: '100%',
    borderCurve: 'continuous',
    borderRadius: 16,
    overflow: 'hidden',
  },
  coinIconFallbackLarge: {
    borderRadius: 18,
    height: 36,
    overflow: 'visible',
    width: 36,
  },
  coinIconFallbackSmall: {
    borderRadius: 8,
    height: 16,
    overflow: 'visible',
    width: 16,
  },
  container: {
    elevation: 6,
    height: 32,
    overflow: 'visible',
  },
  containerLarge: {
    elevation: 6,
    height: 36,
    overflow: 'visible',
  },
  containerSmall: {
    elevation: 6,
    height: 16,
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
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
