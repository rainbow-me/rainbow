import React, { useEffect, useRef } from 'react';
import { findNodeHandle, NativeModules, TextInput } from 'react-native';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { isSymbolStablecoin } from '../../helpers/savings';
import { fonts, fontWithWidth } from '@rainbow-me/styles';

const TextChunk = styled(TextInput).attrs({
  editable: false,
})`
  ${fontWithWidth(fonts.weight.bold)};
  color: ${({ theme: { colors } }) => colors.dark};
  font-variant: tabular-nums;
  font-size: ${parseFloat(fonts.size.lmedium)};
  text-align: left;
  height: 46;
`;

const Row = styled.View`
  flex-direction: row;
  height: 35;
  left: 45;
  position: absolute;
`;

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
