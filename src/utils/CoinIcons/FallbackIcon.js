import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

function buildFallbackFontSize(symbol, width) {
  if (!symbol) return 0;
  else if (width < 30 || symbol.length > 4) return 8;
  else if (symbol.length === 4) return 10;
  else if (symbol.length === 1 || symbol.length === 2) return 13;
  return 11;
}

const _cache = {};
function formatSymbol(symbol, width) {
  if (!symbol) return '';

  const key = `${symbol}-${width}`;

  if (!_cache[key]) {
    _cache[key] = symbol.replace(/[^a-zA-Z0-9]/g, '').substring(0, width < 30 ? 1 : 5);
  }

  return _cache[key];
}

const FallbackIcon = ({ color = '#3A3D51', height, style, symbol = '', textStyles, width, ...props }) => {
  const formattedSymbol = formatSymbol(symbol, width);

  const fontSize = buildFallbackFontSize(formattedSymbol, width);

  return (
    <Animated.View
      {...props}
      style={[
        sx.container,
        {
          backgroundColor: color,
          height,
          width,
        },
        style,
      ]}
    >
      <Text style={[sx.text, { fontSize }, textStyles]}>{formattedSymbol}</Text>
    </Animated.View>
  );
};

const arePropsEqual = (prev, next) =>
  prev.color === next.color && prev.shadowColor === next.shadowColor && prev.size === next.size && prev.symbol === next.symbol;

export default React.memo(FallbackIcon, arePropsEqual);
