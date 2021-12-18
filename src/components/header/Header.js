import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { Row } from '../layout';
import { useDimensions } from '@rainbow-me/hooks';
import styled from 'styled-components';

const StatusBarHeight = getStatusBarHeight(true);
export const HeaderHeight = 44;
export const HeaderHeightWithStatusBar = HeaderHeight + StatusBarHeight;

const Container = styled(Row).attrs(({ align = 'end' }) => ({
  align,
}))({
  height: HeaderHeightWithStatusBar,
  paddingTop: StatusBarHeight,
  width: ({ width }) => width,
  zIndex: 1,
});

export default function Header(props) {
  const { width: deviceWidth } = useDimensions();
  return <Container {...props} width={deviceWidth} />;
}
