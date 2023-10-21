import React from 'react';
// @ts-expect-error // no declaration for this yet
import * as CoinIconsImages from 'react-coin-icon/lib/pngs';
import { Image, StyleSheet, View } from 'react-native';
import { FastChainBadge } from './FastCoinBadge';
import { FastFallbackCoinIconImage } from './FastFallbackCoinIconImage';
import ContractInteraction from '@/assets/contractInteraction.png';
import EthIcon from '@/assets/eth-icon.png';
import { useColorForAsset } from '@/hooks';
import { Network } from '@/networks/types';
import { borders, fonts } from '@/styles';
import { ThemeContextProps } from '@/theme';
import { FallbackIcon as CoinIconTextFallback, isETH } from '@/utils';

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const fallbackIconStyle = {
  ...borders.buildCircleAsObject(40),
  position: 'absolute',
};

function formatSymbol(symbol: string) {
  return symbol
    ? symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()
    : '';
}

/**
 * If mainnet asset is available, get the token under /ethereum/ (token) url.
 * Otherwise let it use whatever type it has
 * @param param0 - optional mainnetAddress, address and network
 * @returns a proper type and address to use for the url
 */
function resolveNetworkAndAddress({
  address,
  mainnetAddress,
  network,
}: {
  mainnetAddress?: string;
  address: string;
  network: Network;
}) {
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

export default React.memo(function FastCoinIcon({
  address,
  mainnetAddress,
  network,
  symbol,
  theme,
}: {
  address: string;
  mainnetAddress?: string;
  network: Network;
  symbol: string;
  theme: ThemeContextProps;
}) {
  const { colors } = theme;

  const { resolvedNetwork, resolvedAddress } = resolveNetworkAndAddress({
    address,
    mainnetAddress,
    network,
  });

  const fallbackIconColor = useColorForAsset({
    address: resolvedAddress,
  });

  const shadowColor = theme.isDarkMode ? colors.shadow : fallbackIconColor;

  const eth = isETH(resolvedAddress);

  const formattedSymbol = formatSymbol(symbol);

  const shouldRenderFallback = !eth;
  const shouldRenderLocalCoinIconImage =
    !shouldRenderFallback && !!CoinIconsImages[formattedSymbol];
  const shouldRenderContract = symbol === 'contract';

  return (
    <View style={sx.container}>
      {eth ? (
        <View
          style={[
            sx.coinIconFallback,
            sx.reactCoinIconContainer,
            sx.withShadow,
            { shadowColor },
          ]}
        >
          <Image source={EthIcon} style={sx.coinIconFallback} />
        </View>
      ) : shouldRenderLocalCoinIconImage ? (
        <View
          style={[
            sx.coinIconFallback,
            sx.reactCoinIconContainer,
            sx.withShadow,
            { shadowColor },
          ]}
        >
          <Image
            resizeMode="contain"
            source={CoinIconsImages[formattedSymbol]}
            style={sx.reactCoinIconImage}
          />
        </View>
      ) : shouldRenderContract ? (
        <Image source={ContractInteraction} style={sx.contract} />
      ) : (
        <FastFallbackCoinIconImage
          address={resolvedAddress}
          network={resolvedNetwork}
          shadowColor={shadowColor}
          symbol={symbol}
          theme={theme}
        >
          {() => (
            <CoinIconTextFallback
              color={fallbackIconColor}
              height={40}
              style={fallbackIconStyle}
              symbol={symbol}
              textStyles={fallbackTextStyles}
              width={40}
            />
          )}
        </FastFallbackCoinIconImage>
      )}

      {network && <FastChainBadge network={network} theme={theme} />}
    </View>
  );
});

const sx = StyleSheet.create({
  coinIconFallback: {
    borderRadius: 20,
    height: 40,
    overflow: 'visible',
    width: 40,
  },
  container: {
    elevation: 6,
    height: 59,
    overflow: 'visible',
    paddingTop: 9,
  },
  contract: {
    height: 40,
    width: 40,
  },
  reactCoinIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactCoinIconImage: {
    height: '100%',
    width: '100%',
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
