import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components';
import { Row } from '../layout';
import { useDimensions } from '@rainbow-me/hooks';

const StatusBarHeight = getStatusBarHeight(true);
export const HeaderHeight = 44;
export const HeaderHeightWithStatusBar = HeaderHeight + StatusBarHeight;

const Container = styled(Row).attrs(({ align = 'end' }) => ({
  align,
}))`
  height: ${HeaderHeightWithStatusBar};
  padding-top: ${StatusBarHeight};
  width: ${({ width }) => width};
  z-index: 1;
`;

export default function Header(props) {
  const { width: deviceWidth } = useDimensions();
  return <Container {...props} width={deviceWidth} />;
}
