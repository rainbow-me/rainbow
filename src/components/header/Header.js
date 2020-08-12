import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import { Row } from '../layout';

const StatusBarHeight = getStatusBarHeight(true);
export const HeaderHeight = 44;
export const HeaderHeightWithStatusBar = HeaderHeight + StatusBarHeight;

const Container = styled(Row).attrs({
  align: 'end',
})`
  height: ${HeaderHeightWithStatusBar};
  padding-top: ${StatusBarHeight};
  width: ${({ width }) => width};
  z-index: 1;
`;

export default function Header(props) {
  const { width: deviceWidth } = useDimensions();
  return <Container {...props} width={deviceWidth} />;
}
