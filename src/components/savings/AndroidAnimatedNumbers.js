import React, { useEffect, useRef } from 'react';
import { findNodeHandle, NativeModules, TextInput } from 'react-native';
import { isSymbolStablecoin } from '../../helpers/savings';
import { useTheme } from '../../theme/ThemeContext';
import styled from '@rainbow-me/styled-components';
import { fonts, fontWithWidth } from '@rainbow-me/styles';

const TextChunk = styled(TextInput).attrs({
  editable: false,
})({
  color: ({ theme: { colors } }) => colors.dark,
  fontSize: parseFloat(fonts.size.lmedium),
  fontVariant: ['tabular-nums'],
  height: 46,
  textAlign: 'left',
  ...fontWithWidth(fonts.weight.bold),
});

const Row = styled.View({
  flexDirection: 'row',
  height: 35,
  left: 45,
  position: 'absolute',
});

function formatSavingsAmount(val) {
  return val.toFixed(10);
}

function formatter(symbol, val) {
  return isSymbolStablecoin(symbol)
    ? `$${formatSavingsAmount(val)}`
    : `${formatSavingsAmount(val)} ${symbol}`;
}

const { RNTextAnimator } = NativeModules;

export default function AndroidText({ style, animationConfig }) {
  const isStable = isSymbolStablecoin(animationConfig.symbol);
  const { isDarkMode } = useTheme();

  const ref = useRef();
  useEffect(() => {
    const screen = findNodeHandle(ref.current.getNativeRef());
    RNTextAnimator.animate(screen, {
      ...animationConfig,
      darkMode: isDarkMode,
      isStable,
    });
    return () => RNTextAnimator.stop(screen);
  }, [animationConfig, isStable, isDarkMode]);

  return (
    <Row style={style}>
      <TextChunk
        defaultValue={formatter(
          animationConfig.symbol,
          animationConfig.initialValue
        )}
        ref={ref}
      />
    </Row>
  );
}
