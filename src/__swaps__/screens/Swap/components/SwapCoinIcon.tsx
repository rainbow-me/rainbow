/* eslint-disable no-nested-ternary */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import EthIcon from '@/assets/eth-icon.png';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { globalColors } from '@/design-system';
import { Network } from '@/networks/types';
import { borders, fonts } from '@/styles';
import { useTheme } from '@/theme';
import { FallbackIcon as CoinIconTextFallback, isETH } from '@/utils';
import { FastFallbackCoinIconImage } from '@/components/asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage';
import Animated from 'react-native-reanimated';
import FastImage, { Source } from 'react-native-fast-image';

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
  disableShadow = true,
  forceDarkMode,
  large,
  mainnetAddress,
  network,
  small,
  symbol,
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
}) {
  const theme = useTheme();

  const { resolvedNetwork, resolvedAddress } = resolveNetworkAndAddress({
    address,
    mainnetAddress,
    network,
  });

  const fallbackIconColor = color ?? theme.colors.purpleUniswap;
  const shadowColor = theme.isDarkMode || forceDarkMode ? theme.colors.shadow : color || fallbackIconColor;
  const eth = isETH(resolvedAddress);

  return (
    <View style={small ? sx.containerSmall : large ? sx.containerLarge : sx.container}>
      {eth ? (
        <Animated.View
          key={`${resolvedAddress}-${eth}`}
          style={[
            sx.reactCoinIconContainer,
            small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback,
            small || disableShadow ? {} : sx.withShadow,
            { shadowColor },
          ]}
        >
          <FastImage
            source={EthIcon as Source}
            style={small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback}
          />
        </Animated.View>
      ) : (
        <FastFallbackCoinIconImage
          size={small ? 16 : large ? 36 : 32}
          icon={iconUrl}
          network={resolvedNetwork}
          shadowColor={shadowColor}
          symbol={symbol}
          theme={theme}
        >
          {() => (
            <CoinIconTextFallback
              color={color}
              height={small ? 16 : large ? 36 : 32}
              style={small ? smallFallbackIconStyle : large ? largeFallbackIconStyle : fallbackIconStyle}
              symbol={symbol}
              textStyles={fallbackTextStyles}
              width={small ? 16 : large ? 36 : 32}
            />
          )}
        </FastFallbackCoinIconImage>
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
