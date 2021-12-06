import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { Row } from '../layout';
import ExchangeNotchLeft from '@rainbow-me/assets/exchangeNotchLeft.png';
import ExchangeNotchLeftDark from '@rainbow-me/assets/exchangeNotchLeftDark.png';
import ExchangeNotchMiddle from '@rainbow-me/assets/exchangeNotchMiddle.png';
import ExchangeNotchMiddleDark from '@rainbow-me/assets/exchangeNotchMiddleDark.png';
import ExchangeNotchRight from '@rainbow-me/assets/exchangeNotchRight.png';
import ExchangeNotchRightDark from '@rainbow-me/assets/exchangeNotchRightDark.png';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';

const notchHeight = 48;
const notchSideWidth = 78;

const Container = styled(Row).attrs({
  pointerEvents: 'none',
})`
  height: ${notchHeight};
  position: absolute;
  top: 132;
  width: 100%;
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'isDarkMode' does not exist on type 'Them... Remove this comment to see the full error message
const NotchMiddle = styled(FastImage).attrs(({ isDarkMode }) => ({
  resizeMode: FastImage.resizeMode.stretch,
  source: isDarkMode ? ExchangeNotchMiddleDark : ExchangeNotchMiddle,
}))`
  height: ${notchHeight};
  width: ${({ deviceWidth }) => deviceWidth - notchSideWidth * 2};
`;

const NotchSide = styled(FastImage)`
  height: ${notchHeight};
  width: ${notchSideWidth};
`;

export default function ExchangeNotch() {
  const { width: deviceWidth } = useDimensions();
  const { isDarkMode } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NotchSide
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        source={isDarkMode ? ExchangeNotchLeftDark : ExchangeNotchLeft}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NotchMiddle deviceWidth={deviceWidth} isDarkMode={isDarkMode} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NotchSide
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        source={isDarkMode ? ExchangeNotchRightDark : ExchangeNotchRight}
      />
    </Container>
  );
}
