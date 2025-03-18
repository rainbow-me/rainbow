import React from 'react';
import { StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
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

function buildFallbackFontSize(symbol: string | undefined, width: number): number {
  if (!symbol) return 0;
  else if (width < 30 || symbol.length > 4) return 8;
  else if (symbol.length === 4) return 10;
  else if (symbol.length === 1 || symbol.length === 2) return 13;
  return 11;
}

const _cache: Record<string, string> = {};
function formatSymbol(symbol: string | undefined, width: number): string {
  if (!symbol) return '';

  const key = `${symbol}-${width}`;

  if (!_cache[key]) {
    _cache[key] = symbol.replace(/[^a-zA-Z0-9]/g, '').substring(0, width < 30 ? 1 : 5);
  }

  return _cache[key];
}

interface FallbackIconProps extends React.ComponentProps<typeof Animated.View> {
  color?: string;
  height: number;
  style?: ViewStyle;
  symbol?: string;
  textStyles?: TextStyle;
  width: number;
  shadowColor?: string;
  size?: number;
}

const FallbackIcon = ({
  color = '#3A3D51',
  height,
  style = undefined,
  symbol = '',
  textStyles = undefined,
  width,
  ...props
}: FallbackIconProps) => {
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

interface FallbackIconPropsForComparison {
  color: string;
  shadowColor: string;
  size: number;
  symbol: string;
}

const arePropsEqual = (prev: FallbackIconPropsForComparison, next: FallbackIconPropsForComparison): boolean =>
  prev.color === next.color && prev.shadowColor === next.shadowColor && prev.size === next.size && prev.symbol === next.symbol;

export default React.memo(FallbackIcon, arePropsEqual as any);
