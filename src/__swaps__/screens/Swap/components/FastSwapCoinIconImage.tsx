import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ImgixImage } from '@/components/images';
import { Network } from '@/networks/types';
import { getUrlForTrustIconFallback } from '@/utils';

export const FastSwapCoinIconImage = React.memo(function FastSwapCoinIconImage({
  address,
  disableShadow = true,
  network,
  shadowColor,
  size,
}: {
  address: string;
  children: () => React.ReactNode;
  disableShadow?: boolean;
  network: Network;
  shadowColor: string;
  size?: number;
}) {
  const imageUrl = getUrlForTrustIconFallback(address, network);

  return (
    <View
      style={[
        sx.coinIconContainer,
        disableShadow ? {} : sx.withShadow,
        disableShadow ? {} : { shadowColor },
        size ? { height: size, width: size } : {},
      ]}
    >
      <ImgixImage
        size={size || 40}
        source={{ uri: imageUrl || '' }}
        style={[sx.coinIconFallback, size ? { height: size, width: size } : {}]}
      />
    </View>
  );
});

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
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
