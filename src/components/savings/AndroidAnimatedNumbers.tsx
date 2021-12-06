import React, { useEffect, useRef } from 'react';
import { findNodeHandle, NativeModules, TextInput } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { isSymbolStablecoin } from '../../helpers/savings';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Row = styled.View`
  flex-direction: row;
  height: 35;
  left: 45;
  position: absolute;
`;

function formatSavingsAmount(val: any) {
  return val.toFixed(10);
}

function formatter(symbol: any, val: any) {
  return isSymbolStablecoin(symbol)
    ? `$${formatSavingsAmount(val)}`
    : `${formatSavingsAmount(val)} ${symbol}`;
}

const { RNTextAnimator } = NativeModules;

export default function AndroidText({ style, animationConfig }: any) {
  const isStable = isSymbolStablecoin(animationConfig.symbol);
  const { isDarkMode } = useTheme();

  const ref = useRef();
  useEffect(() => {
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    const screen = findNodeHandle(ref.current.getNativeRef());
    RNTextAnimator.animate(screen, {
      ...animationConfig,
      darkMode: isDarkMode,
      isStable,
    });
    return () => RNTextAnimator.stop(screen);
  }, [animationConfig, isStable, isDarkMode]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Row style={style}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TextChunk
        defaultValue={formatter(
          animationConfig.symbol,
          animationConfig.initialValue
        )}
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        ref={ref}
      />
    </Row>
  );
}
