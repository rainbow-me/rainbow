/* eslint-disable no-nested-ternary */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import EthIcon from '@/assets/eth-icon.png';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { globalColors } from '@/design-system';
import { borders, fonts } from '@/styles';
import { useTheme } from '@/theme';
import { FallbackIcon as CoinIconTextFallback, isETH } from '@/utils';
import { FastFallbackCoinIconImage } from '@/components/asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage';
import Animated from 'react-native-reanimated';
import FastImage, { Source } from 'react-native-fast-image';
import { ChainId } from '@/chains/types';

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

const fallbackIconStyle = (size: number) => ({
  ...borders.buildCircleAsObject(size),
  position: 'absolute',
});

/**
 * If mainnet asset is available, get the token under /ethereum/ (token) url.
 * Otherwise let it use whatever type it has
 * @param param0 - optional mainnetAddress, address and network
 * @returns a proper type and address to use for the url
 */
function resolveChainIdAndAddress({ address, mainnetAddress }: { mainnetAddress?: string; address: string }) {
  if (mainnetAddress) {
    return {
      resolvedAddress: mainnetAddress,
    };
  }

  return {
    resolvedAddress: address,
  };
}

export const SwapCoinIcon = React.memo(function FeedCoinIcon({
  address,
  color,
  iconUrl,
  disableShadow = true,
  forceDarkMode,
  mainnetAddress,
  chainId,
  symbol,
  size = 32,
  chainSize,
}: {
  address: string;
  color?: string;
  iconUrl?: string;
  disableShadow?: boolean;
  forceDarkMode?: boolean;
  mainnetAddress?: string;
  chainId: ChainId;
  symbol: string;
  size?: number;
  chainSize?: number;
}) {
  const theme = useTheme();

  const { resolvedAddress } = resolveChainIdAndAddress({
    address,
    mainnetAddress,
  });

  const fallbackIconColor = color ?? theme.colors.purpleUniswap;
  const shadowColor = theme.isDarkMode || forceDarkMode ? theme.colors.shadow : color || fallbackIconColor;
  const eth = isETH(resolvedAddress);

  return (
    <View style={[styles.container(size), { height: size }]}>
      {eth ? (
        <Animated.View
          key={`${resolvedAddress}-${eth}`}
          style={[sx.reactCoinIconContainer, styles.coinIcon(size), !disableShadow && sx.withShadow, { shadowColor }]}
        >
          <FastImage source={EthIcon as Source} style={styles.coinIcon(size)} />
        </Animated.View>
      ) : (
        <FastFallbackCoinIconImage size={size} icon={iconUrl} shadowColor={shadowColor} symbol={symbol} theme={theme}>
          {() => (
            <CoinIconTextFallback
              color={color}
              height={size}
              style={fallbackIconStyle(size)}
              symbol={symbol}
              textStyles={fallbackTextStyles}
              width={size}
            />
          )}
        </FastFallbackCoinIconImage>
      )}

      {chainId && chainId !== ChainId.mainnet && size > 16 && (
        <View style={sx.badge}>
          <ChainImage chainId={chainId} size={chainSize ?? 16} />
        </View>
      )}
    </View>
  );
});

const styles = {
  container: (size: number) => ({
    elevation: 6,
    height: size,
    overflow: 'visible' as const,
  }),
  coinIcon: (size: number) => ({
    borderRadius: size / 2,
    height: size,
    width: size,
    overflow: 'visible' as const,
  }),
};

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
