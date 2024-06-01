/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Network } from '@/networks/types';
import { ImgixImage } from '@/components/images';
import { ThemeContextProps } from '@/theme';

export const FastFallbackCoinIconImage = React.memo(function FastFallbackCoinIconImage({
  children,
  icon,
  shadowColor,
  size = 40,
}: {
  children: () => React.ReactNode;
  icon?: string;
  network: Network;
  shadowColor: string;
  size?: number;
  symbol: string;
  theme: ThemeContextProps;
}) {
  const [didErrorForUrl, setDidErrorForUrl] = useState<string | undefined>(undefined);

  return (
    <View style={[sx.coinIconContainer, sx.withShadow, { shadowColor, height: size, width: size, borderRadius: size / 2 }]}>
      {icon === undefined || icon === '' || didErrorForUrl === icon ? (
        <View style={sx.fallbackWrapper}>{children()}</View>
      ) : (
        <ImgixImage
          enableFasterImage
          onError={() => {
            if (icon?.length > 0) {
              setDidErrorForUrl(icon);
            }
          }}
          onLoad={() => setDidErrorForUrl(undefined)}
          size={size}
          source={{ uri: icon }}
          style={[sx.coinIconFallback, { height: size, width: size, borderRadius: size / 2 }]}
        />
      )}
    </View>
  );
});

const sx = StyleSheet.create({
  coinIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  coinIconFallback: {
    overflow: 'hidden',
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
    // ⚠️ CB: Disabling coin icon shadows for now because they are negatively impacting performance
    // elevation: 6,
    // shadowOffset: {
    //   height: 4,
    //   width: 0,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 6,
  },
});
