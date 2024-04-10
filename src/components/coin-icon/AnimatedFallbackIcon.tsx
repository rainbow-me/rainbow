import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, { DerivedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { workerData } from 'worker_threads';

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
  'worklet';
  if (!symbol) return 0;
  else if (width < 30 || symbol.length > 4) return 8;
  else if (symbol.length === 4) return 10;
  else if (symbol.length === 1 || symbol.length === 2) return 13;
  return 11;
}

function formatSymbol(symbol: string, width: number): string {
  'worklet';
  if (!symbol) return '';

  return symbol.replace(/[^a-zA-Z0-9]/g, '').substring(0, width < 30 ? 1 : 5);
}

interface FallbackIconProps {
  color?: DerivedValue<string>;
  height: number;
  style?: ViewStyle | ViewStyle[];
  symbol?: DerivedValue<string>;
  textStyles?: TextStyle | TextStyle[];
  width: number;
}

const AnimatedFallbackIcon: React.FC<FallbackIconProps> = ({ color = '#3A3D51', height, style, symbol, textStyles, width, ...props }) => {
  const [text, setText] = useState(symbol?.value || '');
  const [fontSize, setFontSize] = useState(buildFallbackFontSize(formatSymbol(symbol?.value || '', width), width));

  // this isnt ideal but i couldnt get the text to update using a shared value
  useAnimatedReaction(
    () => symbol?.value || '',
    (symbol, previousSymbol) => {
      if (symbol !== previousSymbol) {
        const formattedSymbol = formatSymbol(symbol, width);
        const fontSize = buildFallbackFontSize(formattedSymbol, width);

        runOnJS(setText)(formattedSymbol);
        runOnJS(setFontSize)(fontSize);
      }
    },
    [symbol]
  );

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
      <Text style={[sx.text, { fontSize }, textStyles]}>{text}</Text>
    </Animated.View>
  );
};

const arePropsEqual = (prev: FallbackIconProps, next: FallbackIconProps) =>
  prev.color === next.color && prev.height === next.height && prev.width === next.width && prev.symbol === next.symbol;

export default React.memo(AnimatedFallbackIcon, arePropsEqual);
