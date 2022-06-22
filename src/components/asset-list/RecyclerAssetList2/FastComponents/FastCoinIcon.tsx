import React from 'react';
// @ts-expect-error // no declaration for this yet
import * as CoinIconsImages from 'react-coin-icon/lib/pngs';
import { Image, StyleSheet, View } from 'react-native';
import { FastChainBadge } from './FastCoinBadge';
import { FastFallbackCoinIconImage } from './FastFallbackCoinIconImage';
import ContractInteraction from '@rainbow-me/assets/contractInteraction.png';
import EthIcon from '@rainbow-me/assets/eth-icon.png';
import { AssetType } from '@rainbow-me/entities';
import { useColorForAsset } from '@rainbow-me/hooks';
import { borders, fonts } from '@rainbow-me/styles';
import {
  FallbackIcon as CoinIconTextFallback,
  getTokenMetadata,
  isETH,
} from '@rainbow-me/utils';

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
 * @param param0 - optional mainnetAddress, address and optional assetType
 * @returns a proper type and address to use for the url
 */
function resolveTypeAndAddress({
  mainnetAddress,
  address,
  assetType,
}: {
  mainnetAddress?: string;
  address: string;
  assetType?: AssetType;
}) {
  if (mainnetAddress) {
    return {
      resolvedAddress: mainnetAddress,
      resolvedType: AssetType.token,
    };
  }

  return {
    resolvedAddress: address,
    resolvedType: assetType,
  };
}

export default React.memo(function FastCoinIcon({
  address,
  mainnetAddress,
  symbol,
  assetType,
  theme,
}: {
  address: string;
  mainnetAddress?: string;
  symbol: string;
  assetType?: AssetType;
  theme: any;
}) {
  const { resolvedType, resolvedAddress } = resolveTypeAndAddress({
    address,
    assetType,
    mainnetAddress,
  });

  const tokenMetadata = getTokenMetadata(resolvedAddress);

  const fallbackIconColor = useColorForAsset({
    address: resolvedAddress,
    type: resolvedType,
  });

  const shadowColor = theme.isDarkMode
    ? theme.colors.shadow
    : tokenMetadata?.shadowColor ?? fallbackIconColor;

  const eth = isETH(resolvedAddress);

  const formattedSymbol = formatSymbol(symbol);

  const shouldRenderFallback = !eth && !tokenMetadata;
  const shouldRenderLocalCoinIconImage =
    !shouldRenderFallback && CoinIconsImages[formattedSymbol];
  const shouldRenderContract = symbol === 'contract';

  return (
    <View style={sx.container}>
      {eth ? (
        <Image source={EthIcon} style={sx.coinIconFallback} />
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
          assetType={resolvedType}
          shadowColor={shadowColor}
          symbol={symbol}
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

      {assetType && <FastChainBadge assetType={assetType} theme={theme} />}
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
