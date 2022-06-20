import React, { useCallback } from 'react';
// @ts-expect-error // no declaration for this yet
import * as CoinIconsImages from 'react-coin-icon/lib/pngs';
import { Image, StyleSheet, View } from 'react-native';
import { FastChainBadge } from './FastCoinBadge';
import ContractInteraction from '@rainbow-me/assets/contractInteraction.png';
import EthIcon from '@rainbow-me/assets/eth-icon.png';
import { AssetType } from '@rainbow-me/entities';
import { useColorForAsset, useForceUpdate } from '@rainbow-me/hooks';
import { ImageWithCachedMetadata, ImgixImage } from '@rainbow-me/images';
import { borders, fonts } from '@rainbow-me/styles';
import {
  FallbackIcon,
  getTokenMetadata,
  getUrlForTrustIconFallback,
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

const ImageState = {
  ERROR: 'ERROR',
  LOADED: 'LOADED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

function formatSymbol(symbol: string) {
  return symbol
    ? symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()
    : '';
}
const imagesCache: { [imageUrl: string]: keyof typeof ImageState } = {};

const CoinIconWithBackground = React.memo(function CoinIconWithBackground({
  address,
  assetType,
  symbol,
  shadowColor,
  children,
}: {
  address: string;
  assetType?: AssetType;
  symbol: string;
  shadowColor: string;
  children: () => React.ReactNode;
}) {
  const imageUrl = getUrlForTrustIconFallback(address, assetType)!;

  const key = `${symbol}-${imageUrl}`;

  const shouldShowImage = imagesCache[key] !== ImageState.NOT_FOUND;
  const isLoaded = imagesCache[key] === ImageState.LOADED;

  // we store data inside the object outside the component
  // so we can share it between component instances
  // but we still want the component to pick up new changes
  const forceUpdate = useForceUpdate();

  const onLoad = useCallback(() => {
    if (imagesCache[key] === ImageState.LOADED) {
      return;
    }

    imagesCache[key] = ImageState.LOADED;
    forceUpdate();
  }, [key, forceUpdate]);
  const onError = useCallback(
    err => {
      const newError = err.nativeEvent.message?.includes('404')
        ? ImageState.NOT_FOUND
        : ImageState.ERROR;

      if (imagesCache[key] === newError) {
        return;
      } else {
        imagesCache[key] = newError;
      }

      forceUpdate();
    },
    [key, forceUpdate]
  );

  return (
    <View
      style={[sx.coinIconContainer, { shadowColor }, isLoaded && sx.withShadow]}
    >
      {shouldShowImage && (
        <ImageWithCachedMetadata
          cache={ImgixImage.cacheControl.immutable}
          imageUrl={imageUrl}
          onError={onError}
          onLoad={onLoad}
          size={32}
          style={[sx.coinIconFallback, isLoaded && sx.withBackground]}
        />
      )}

      {!isLoaded && <View style={sx.fallbackWrapper}>{children()}</View>}
    </View>
  );
});

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
  const tokenMetadata = getTokenMetadata(mainnetAddress || address);

  const type = mainnetAddress ? AssetType.token : assetType;

  const fallbackIconColor = useColorForAsset({
    address: mainnetAddress || address,
    type,
  });

  const shadowColor = theme.isDarkMode
    ? theme.colors.shadow
    : tokenMetadata?.shadowColor ?? fallbackIconColor;

  const eth = isETH(mainnetAddress || address);

  const formattedSymbol = formatSymbol(symbol);

  const renderFallback = !eth && !tokenMetadata;
  const renderCoinIcon = !renderFallback && CoinIconsImages[formattedSymbol];
  const renderContract = symbol === 'contract';

  return (
    <View style={sx.container}>
      {eth ? (
        <Image source={EthIcon} style={sx.coinIconFallback} />
      ) : renderCoinIcon ? (
        <View
          style={[
            sx.coinIconFallback,
            sx.reactCoinIconContainer,
            sx.withShadow,
          ]}
        >
          <Image
            resizeMode="contain"
            source={CoinIconsImages[formattedSymbol]}
            style={sx.reactCoinIconImage}
          />
        </View>
      ) : renderContract ? (
        <Image source={ContractInteraction} style={sx.contract} />
      ) : (
        <CoinIconWithBackground
          address={mainnetAddress ?? address}
          assetType={type}
          shadowColor={shadowColor}
          symbol={symbol}
        >
          {() => (
            <FallbackIcon
              color={fallbackIconColor}
              height={40}
              style={fallbackIconStyle}
              symbol={symbol}
              textStyles={fallbackTextStyles}
              width={40}
            />
          )}
        </CoinIconWithBackground>
      )}

      {assetType && <FastChainBadge assetType={assetType} theme={theme} />}
    </View>
  );
});

const sx = StyleSheet.create({
  coinIconContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    // overflow: 'visible',
    width: 40,
  },
  coinIconFallback: {
    borderRadius: 20,
    height: 40,
    overflow: 'visible',
    width: 40,
  },
  container: {
    elevation: 6,
    height: 60,
    overflow: 'visible',
    paddingTop: 9.5,
  },
  contract: {
    height: 40,
    width: 40,
  },
  fallbackWrapper: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  reactCoinIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactCoinIconImage: {
    height: '100%',
    width: '100%',
  },
  withBackground: {
    backgroundColor: 'white',
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
