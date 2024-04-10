import React from 'react';
import { StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
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

interface Cache {
  [key: string]: string;
}

function buildFallbackFontSize(symbol: string, width: number): number {
  if (!symbol) return 0;
  else if (width < 30 || symbol.length > 4) return 8;
  else if (symbol.length === 4) return 10;
  else if (symbol.length === 1 || symbol.length === 2) return 13;
  return 11;
}

const _cache: Cache = {};
function formatSymbol(symbol: string, width: number): string {
  if (!symbol) return '';

  const key = `${symbol}-${width}`;

  if (!_cache[key]) {
    _cache[key] = symbol.replace(/[^a-zA-Z0-9]/g, '').substring(0, width < 30 ? 1 : 5);
  }

  return _cache[key];
}

interface FallbackIconProps {
  color?: string;
  height: number;
  style?: ViewStyle | ViewStyle[];
  symbol?: string;
  textStyles?: TextStyle | TextStyle[];
  width: number;
}

const FallbackIcon: React.FC<FallbackIconProps> = ({ color = '#3A3D51', height, style, symbol = '', textStyles, width, ...props }) => {
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

const arePropsEqual = (prev: FallbackIconProps, next: FallbackIconProps) =>
  prev.color === next.color && prev.height === next.height && prev.width === next.width && prev.symbol === next.symbol;

export default React.memo(FallbackIcon, arePropsEqual);
