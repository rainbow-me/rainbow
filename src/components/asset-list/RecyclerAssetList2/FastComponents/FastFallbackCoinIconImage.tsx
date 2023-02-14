import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AssetType } from '@/entities';
import { ImgixImage } from '@/components/images';
import { ThemeContextProps } from '@/theme';
import { getUrlForTrustIconFallback } from '@/utils';

export const FastFallbackCoinIconImage = function FastFallbackCoinIconImage({
  address,
  assetType,
  symbol,
  shadowColor,
  theme,
  children,
}: {
  theme: ThemeContextProps;
  address: string;
  assetType?: AssetType;
  symbol: string;
  shadowColor: string;
  children: () => React.ReactNode;
}) {
  const imageUrl = getUrlForTrustIconFallback(address, assetType)!;
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  return (
    <View style={[sx.coinIconContainer, sx.withShadow, { shadowColor }]}>
      {!isError && (
        <ImgixImage
          source={{ uri: imageUrl }}
          size={40}
          style={[sx.coinIconFallback]}
          onLoadEnd={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
        />
      )}
      {(isError || !isLoaded) && (
        <View style={sx.fallbackWrapper}>{children()}</View>
      )}
    </View>
  );
};

const sx = StyleSheet.create({
  coinIconContainer: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    overflow: 'visible',
    width: 40,
  },
  coinIconFallback: {
    borderRadius: 20,
    height: 40,
    overflow: 'hidden',
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
