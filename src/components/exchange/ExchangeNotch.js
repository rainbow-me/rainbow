import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import ExchangeNotchLeft from '@rainbow-me/assets/exchangeNotchLeft.png';
import ExchangeNotchLeftDark from '@rainbow-me/assets/exchangeNotchLeftDark.png';
import ExchangeNotchMiddle from '@rainbow-me/assets/exchangeNotchMiddle.png';
import ExchangeNotchMiddleDark from '@rainbow-me/assets/exchangeNotchMiddleDark.png';
import ExchangeNotchRight from '@rainbow-me/assets/exchangeNotchRight.png';
import ExchangeNotchRightDark from '@rainbow-me/assets/exchangeNotchRightDark.png';
import { darkMode } from '@rainbow-me/config/debug'; // TODO DARKMODE
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

const NotchMiddle = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.stretch,
  source: darkMode ? ExchangeNotchMiddleDark : ExchangeNotchMiddle,
})`
  height: ${notchHeight};
  width: ${({ deviceWidth }) => deviceWidth - notchSideWidth * 2};
`;

const NotchSide = styled(FastImage)`
  height: ${notchHeight};
  width: ${notchSideWidth};
`;

export default function ExchangeNotch() {
  const { width: deviceWidth } = useDimensions();
  return (
    <Container>
      <NotchSide
        source={darkMode ? ExchangeNotchLeftDark : ExchangeNotchLeft}
      />
      <NotchMiddle deviceWidth={deviceWidth} />
      <NotchSide
        source={darkMode ? ExchangeNotchRightDark : ExchangeNotchRight}
      />
    </Container>
  );
}
