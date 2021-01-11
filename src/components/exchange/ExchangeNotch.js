import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import ExchangeNotchLeft from '@rainbow-me/assets/exchangeNotchLeft.png';
import ExchangeNotchMiddle from '@rainbow-me/assets/exchangeNotchMiddle.png';
import ExchangeNotchRight from '@rainbow-me/assets/exchangeNotchRight.png';
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
  source: ExchangeNotchMiddle,
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
      <NotchSide source={ExchangeNotchLeft} />
      <NotchMiddle deviceWidth={deviceWidth} />
      <NotchSide source={ExchangeNotchRight} />
    </Container>
  );
}
