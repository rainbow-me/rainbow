/* eslint-disable import/namespace */
import React, { useMemo } from 'react';
import * as CoinIconsImages from 'react-coin-icon/lib/pngs';
import { Image } from 'react-native';
import { StyleSheet, View } from 'react-primitives';
import FallbackIcon from './FallbackIcon';

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});

function formatSymbol(symbol) {
  return symbol
    ? symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase()
    : '';
}

const CoinIcon = ({
  color = '#3A3D51',
  fallbackRenderer: Fallback = FallbackIcon,
  forceFallback,
  shadowColor,
  size = 32,
  style,
  symbol,
  ...props
}) => {
  const formattedSymbol = useMemo(() => formatSymbol(symbol), [symbol]);

  const circleProps = useMemo(
    () => ({
      borderRadius: size / 2,
      height: size,
      width: size,
    }),
    [size]
  );

  const shadowProps = useMemo(() => {
    const isSmall = size < 30;

    return {
      elevation: isSmall ? 4.5 : 6,
      shadowColor: shadowColor || color,
      shadowOffset: {
        height: isSmall ? 3 : 4,
        width: 0,
      },
      shadowOpacity: isSmall ? 0.2 : 0.3,
      shadowRadius: isSmall ? 4.5 : 6,
    };
  }, [color, shadowColor, size]);

  if (!forceFallback && CoinIconsImages[formattedSymbol]) {
    return (
      <View {...circleProps} {...shadowProps} style={[sx.container, style]}>
        <Image
          resizeMode="contain"
          source={CoinIconsImages[formattedSymbol]}
          style={sx.image}
        />
      </View>
    );
  }

  return (
    <View {...circleProps} style={[sx.container, style]}>
      <Fallback
        {...circleProps}
        {...shadowProps}
        color={color}
        symbol={formattedSymbol}
        size={size}
        {...props}
      />
    </View>
  );
};

const arePropsEqual = (prev, next) =>
  prev.color === next.color &&
  prev.shadowColor === next.shadowColor &&
  prev.size === next.size &&
  prev.symbol === next.symbol;

export default React.memo(CoinIcon, arePropsEqual);
